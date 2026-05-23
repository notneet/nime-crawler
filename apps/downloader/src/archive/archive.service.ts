import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import { S3Service } from '@libs/commons/s3/s3.service';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { parseQualityRank, pickMaxMin } from '@libs/commons/download/quality';
import { Anime, Episode, Mirror, DownloadArchive } from '@libs/commons/entities';

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
        await this.archive(row, ep, pick, slug);
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
      .sort((a, b) => hostPreference(a.streamUrl) - hostPreference(b.streamUrl));
    return pickMaxMin(resolvable, (m) => parseQualityRank(m.quality))
      .map((m) => ({ streamUrl: m.streamUrl, quality: m.quality, rank: parseQualityRank(m.quality) as number }));
  }

  private async archive(
    row: DownloadArchive,
    ep: Episode,
    pick: Pick,
    slug: string,
  ): Promise<void> {
    const { stream, done, kill } = this.streamYtdlp(pick.streamUrl, pick.quality);
    const number = (ep.number ?? `ep${ep.id}`).replace(/[^\w.-]/g, '_');
    const key = this.s3.buildKey({ source: ep.source, slug, number, quality: pick.quality, ext: 'mp4' });
    this.logger.log(`uploading ${pick.quality} -> ${key}`);
    // Promise.all attaches handlers to BOTH promises up front: if yt-dlp fails
    // after the upload settles (or vice versa), neither rejection is orphaned.
    let up: Awaited<ReturnType<S3Service['upload']>>;
    try {
      [up] = await Promise.all([this.s3.upload(key, stream, 'video/mp4'), done]);
    } catch (err) {
      kill();
      throw err;
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

  private streamYtdlp(
    url: string,
    label: string,
  ): { stream: Readable; done: Promise<void>; kill: () => void } {
    const child = spawn(
      this.ytdlpBin,
      ['--no-warnings', '--no-part', '--no-playlist', '--newline', '-f', 'best[ext=mp4]/best', '-o', '-', url],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let err = '';
    let lastLog = 0;
    child.stderr.on('data', (d: Buffer) => {
      const text = d.toString();
      err = (err + text).slice(-4000);
      const m = text.match(/\[download\]\s+\d[\d.]*%[^\n\r]*/g);
      const line = m?.at(-1)?.trim();
      const now = Date.now();
      if (line && now - lastLog >= 2000) {
        lastLog = now;
        this.logger.verbose(`${label} ${line}`);
      }
    });
    const done = new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.stdout.once('error', reject);
      child.once('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`yt-dlp exit ${code}: ${err.slice(-500)}`)),
      );
    });
    const kill = () => {
      if (!child.killed) child.kill('SIGKILL');
    };
    return { stream: child.stdout, done, kill };
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

function hostPreference(streamUrl: string): number {
  return streamUrl.includes('desustream.info') ? 0 : 1;
}
