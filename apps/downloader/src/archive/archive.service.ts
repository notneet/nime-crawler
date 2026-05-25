import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { PassThrough } from 'node:stream';
import { S3Service } from '@libs/commons/s3/s3.service';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { parseQualityRank, pickMaxMin } from '@libs/commons/download/quality';
import { Anime, Episode, Mirror, DownloadArchive } from '@libs/commons/entities';
import { EmbedResolverService } from './embed-resolver.service';

interface Pick {
  streamUrl: string;
  quality: string;
  rank: number;
}

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);
  private readonly ytdlpBin: string;

  constructor(
    private readonly ds: DataSource,
    private readonly s3: S3Service,
    private readonly embedResolver: EmbedResolverService,
    cfg: ConfigService,
  ) {
    this.ytdlpBin = cfg.get<string>('YTDLP_BIN', 'yt-dlp');
  }

  async handle(job: DownloadJobDto): Promise<void> {
    const mode = job.streamUrl ? 'episode-stream' : job.mirrorId != null ? `mirror=${job.mirrorId}` : 'auto(max+min)';
    this.logger.log(
      `archive job: episode=${job.episodeId} source=${job.source} ${job.manual ? 'manual' : 'auto'} ${mode}`,
    );
    const ep = await this.ds.getRepository(Episode).findOneBy({ id: job.episodeId });
    if (!ep) {
      this.logger.warn(`episode not found: ${job.episodeId}`);
      return;
    }

    const picks = await this.selectPicks(job, ep);
    if (picks.length === 0) {
      this.logger.warn(`nothing resolvable to archive for episode ${ep.id}`);
      return;
    }
    this.logger.log(`episode ${ep.id}: ${picks.length} pick(s) -> ${picks.map((p) => p.quality).join(', ')}`);

    const slug = await this.resolveSlug(ep);
    let archived = 0;
    for (const pick of picks) {
      const row = await this.upsertPending(ep, pick);
      try {
        await this.archive(row, ep, pick, slug, job.faststart ?? false);
        archived++;
      } catch (err) {
        await this.markFailed(row, err);
      }
    }
    // Throw so the consumer Nacks (dead-letters) instead of ACKing a job that
    // archived nothing — otherwise an all-failed/interrupted job is lost.
    if (archived === 0) {
      throw new Error(`archive failed for all ${picks.length} pick(s), episode ${ep.id}`);
    }
    this.logger.log(`archive job done: episode=${ep.id} (${archived}/${picks.length} archived)`);
  }

  private async selectPicks(job: DownloadJobDto, ep: Episode): Promise<Pick[]> {
    // Episode's own player stream — resolved server-side, archived as lowest (rank 0).
    if (job.streamUrl) {
      return [{ streamUrl: job.streamUrl, quality: 'source', rank: 0 }];
    }
    const repo = this.ds.getRepository(Mirror);
    if (job.mirrorId != null) {
      const mr = await repo.findOneBy({ id: job.mirrorId });
      const rank = mr?.quality != null ? parseQualityRank(mr.quality) : null;
      return mr?.streamUrl && rank != null
        ? [{ streamUrl: mr.streamUrl, quality: mr.quality, rank }]
        : [];
    }
    const mirrors = await repo.find({ where: { episodeUrl: ep.url } });
    const resolvable = mirrors
      .filter((m): m is Mirror & { streamUrl: string } => Boolean(m.streamUrl))
      .sort((a, b) => a.id - b.id);
    return pickMaxMin(resolvable, (m) => parseQualityRank(m.quality))
      .map((m) => ({ streamUrl: m.streamUrl, quality: m.quality, rank: parseQualityRank(m.quality) as number }));
  }

  private async archive(
    row: DownloadArchive,
    ep: Episode,
    pick: Pick,
    slug: string,
    faststart: boolean,
  ): Promise<void> {
    const number = (ep.number ?? `ep${ep.id}`).replace(/[^\w.-]/g, '_');
    const key = this.s3.buildKey({ source: ep.source, slug, number, quality: pick.quality, ext: 'mp4' });
    this.logger.log(`uploading ${pick.quality} -> ${key}${faststart ? ' [faststart]' : ''}`);

    let up: Awaited<ReturnType<S3Service['upload']>>;
    try {
      up = await this.upload(pick.streamUrl, pick.quality, [], key, faststart);
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes('Unsupported URL')) throw err;
      this.logger.log(`yt-dlp unsupported, resolving embed url=${pick.streamUrl}`);
      const resolved = await this.embedResolver.resolve(pick.streamUrl);
      if (!resolved) throw new Error(`embed resolve failed for ${pick.streamUrl}`);
      up = await this.upload(resolved.url, pick.quality, headersToArgs(resolved.headers), key, faststart);
    }

    await this.ds.getRepository(DownloadArchive).update(row.id, {
      status: 'done',
      s3Key: up.key,
      s3Bucket: up.bucket,
      sizeBytes: String(up.sizeBytes),
      error: null,
    });
    this.logger.log(`done ${pick.quality} -> ${up.key} (${up.sizeBytes} bytes)`);
  }

  private async upload(
    url: string,
    label: string,
    extraArgs: string[],
    key: string,
    faststart: boolean,
  ): Promise<Awaited<ReturnType<S3Service['upload']>>> {
    if (faststart) {
      return this.uploadViaTmp(url, label, extraArgs, key, true);
    }
    if (await this.s3.ping()) {
      return this.uploadDirect(url, label, extraArgs, key);
    }
    this.logger.warn('S3 unreachable, using temp-file fallback');
    return this.uploadViaTmp(url, label, extraArgs, key, false);
  }

  private async uploadDirect(
    url: string,
    label: string,
    extraArgs: string[],
    key: string,
  ): Promise<Awaited<ReturnType<S3Service['upload']>>> {
    const child = spawn(
      this.ytdlpBin,
      ['--no-warnings', '--no-part', '--no-playlist', '--newline', '--socket-timeout', '30',
       ...extraArgs, '-f', 'bestvideo[vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc]/best[ext=mp4]/best', '--merge-output-format', 'mp4', '-o', '-', url],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const getErr = this.captureBuffer(child.stderr!);
    this.attachProgress(child.stderr!, label); // when piping to stdout, yt-dlp sends progress to stderr
    const pass = new PassThrough();
    child.stdout!.pipe(pass);
    pass.on('error', () => {}); // error propagated via ytdlpDone; suppress unhandled-error event

    const ytdlpDone = new Promise<void>((resolve, reject) => {
      child.once('error', (e) => { pass.destroy(e as Error); reject(e); });
      child.once('close', (code: number) => {
        if (code === 0) { resolve(); return; }
        const e = new Error(`yt-dlp exit ${code}: ${getErr().slice(-500)}`);
        pass.destroy(e);
        reject(e);
      });
    });

    const uploadP = this.s3.upload(key, pass, 'video/mp4');
    await Promise.all([uploadP, ytdlpDone]).catch((e: unknown) => {
      if (!child.killed) child.kill();
      throw e;
    });
    return uploadP;
  }

  private async uploadViaTmp(
    url: string,
    label: string,
    extraArgs: string[],
    key: string,
    faststart: boolean,
  ): Promise<Awaited<ReturnType<S3Service['upload']>>> {
    const tmpFile = join(tmpdir(), `nime-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
    const allArgs = faststart
      ? [...extraArgs, '--postprocessor-args', 'ffmpeg:-movflags +faststart']
      : extraArgs;
    try {
      await this.runYtdlp(url, label, allArgs, tmpFile);
      return await this.s3.upload(key, createReadStream(tmpFile), 'video/mp4');
    } finally {
      await unlink(tmpFile).catch(() => {});
    }
  }

  private attachProgress(stream: NodeJS.ReadableStream, label: string): void {
    let lastLog = 0;
    (stream as import('node:stream').Readable).on('data', (d: Buffer) => {
      const now = Date.now();
      for (const line of d.toString().split(/\r?\n/).filter(Boolean)) {
        const isProgress = /^\[download\]\s+\d[\d.]*%/.test(line);
        if (isProgress && now - lastLog < 2000) continue;
        if (isProgress) lastLog = now;
        this.logger.verbose(`${label} ${line.trim()}`);
      }
    });
  }

  private captureBuffer(stream: NodeJS.ReadableStream): () => string {
    let buf = '';
    (stream as import('node:stream').Readable).on('data', (d: Buffer) => {
      buf = (buf + d.toString()).slice(-4000);
    });
    return () => buf;
  }

  private runYtdlp(
    url: string,
    label: string,
    extraArgs: string[],
    outFile: string,
  ): Promise<void> {
    this.logger.log(`yt-dlp start label=${label} url=${url.length > 100 ? url.slice(0, 100) + '…' : url}`);
    const child = spawn(
      this.ytdlpBin,
      ['--no-warnings', '--no-part', '--no-playlist', '--newline', '--socket-timeout', '30', ...extraArgs, '-f', 'bestvideo[vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc]/best[ext=mp4]/best', '--merge-output-format', 'mp4', '-o', outFile, url],
      { stdio: ['ignore', 'pipe', 'pipe'] }, // stdout: progress (file output mode), stderr: errors
    );
    this.attachProgress(child.stdout!, label);
    const getErr = this.captureBuffer(child.stderr!);
    return new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code: number) =>
        code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}: ${getErr().slice(-500)}`)),
      );
    });
  }

  private async resolveSlug(ep: Episode): Promise<string> {
    if (!ep.animeUrl) return `unknown-anime-${ep.id}`;
    const anime = await this.ds.getRepository(Anime).findOneBy({ source: ep.source, url: ep.animeUrl });
    return anime?.slug ?? `unknown-anime-${ep.id}`;
  }

  private async upsertPending(ep: Episode, pick: Pick): Promise<DownloadArchive> {
    const repo = this.ds.getRepository(DownloadArchive);
    const fields = {
      source: ep.source,
      quality: pick.quality,
      sourceUrl: pick.streamUrl,
      s3Bucket: this.s3.bucket,
      s3Key: '',
      status: 'pending' as const,
      error: null,
      sizeBytes: null,
    };
    const existing = await repo.findOneBy({ episodeId: ep.id, qualityRank: pick.rank });
    if (existing) {
      await repo.update(existing.id, fields);
      return repo.findOneByOrFail({ id: existing.id });
    }
    return repo.save(repo.create({ episodeId: ep.id, qualityRank: pick.rank, ...fields }));
  }

  private async markFailed(row: DownloadArchive, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    this.logger.error(`archive failed (row ${row.id}, episode ${row.episodeId}): ${message}`);
    await this.ds.getRepository(DownloadArchive).update(row.id, { status: 'failed', error: message });
  }
}

function headersToArgs(headers: Record<string, string>): string[] {
  return Object.entries(headers).flatMap(([k, v]) => ['--add-header', `${k}:${v}`]);
}
