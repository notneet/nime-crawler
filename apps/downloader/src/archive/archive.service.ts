import { Injectable, Logger } from '@nestjs/common';
import { DataSource, QueryDeepPartialEntity } from 'typeorm';
import { Readable } from 'node:stream';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { S3Service } from '@libs/commons/s3/s3.service';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { parseQualityRank, pickMaxMin } from '@libs/commons/download/quality';
import { Anime, Episode, DownloadLink, DownloadArchive } from '@libs/commons/entities';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    private readonly ds: DataSource,
    private readonly s3: S3Service,
  ) {}

  async handle(job: DownloadJobDto): Promise<void> {
    const ep = await this.ds.getRepository(Episode).findOneBy({ id: job.episodeId });
    if (!ep) {
      this.logger.warn(`episode not found: ${job.episodeId}`);
      return;
    }

    const downloads = await this.ds
      .getRepository(DownloadLink)
      .find({ where: { ownerUrl: ep.url, kind: 'download' } });
    const picks = pickMaxMin(downloads, (d) => parseQualityRank(d.quality));
    if (picks.length === 0) {
      this.logger.log(`no candidates for episode ${ep.id}`);
      return;
    }

    const slug = await this.resolveSlug(ep);
    for (const dl of picks) {
      const rank = parseQualityRank(dl.quality);
      if (rank === null) continue;
      const quality = `${rank}p`;
      const row = await this.upsertPending(ep, dl, rank, quality);
      await this.archive(row, ep, dl, slug, quality).catch((err: unknown) => this.markFailed(row, err));
    }
  }

  private async archive(
    row: DownloadArchive,
    ep: Episode,
    dl: DownloadLink,
    slug: string,
    quality: string,
  ): Promise<void> {
    const res = await fetch(dl.url);
    if (!res.ok || !res.body) throw new Error(`fetch ${res.status}`);
    const ct = res.headers.get('content-type') ?? undefined;
    const ext = this.s3.extOfContentType(ct);
    const number = (ep.number ?? `ep${ep.id}`).replace(/[^\w.-]/g, '_');
    const key = this.s3.buildKey({ source: ep.source, slug, number, quality, ext });
    const body = Readable.fromWeb(res.body as unknown as WebReadableStream<Uint8Array>);
    const up = await this.s3.upload(key, body, ct);
    await this.ds.getRepository(DownloadArchive).update(row.id, {
      status: 'done',
      s3Key: up.key,
      s3Bucket: up.bucket,
      sizeBytes: String(up.sizeBytes),
      error: null,
    });
  }

  private async resolveSlug(ep: Episode): Promise<string> {
    if (!ep.animeUrl) return `unknown-anime-${ep.id}`;
    const anime = await this.ds.getRepository(Anime).findOneBy({ source: ep.source, url: ep.animeUrl });
    return anime?.slug ?? `unknown-anime-${ep.id}`;
  }

  private async upsertPending(
    ep: Episode,
    dl: DownloadLink,
    rank: number,
    quality: string,
  ): Promise<DownloadArchive> {
    const repo = this.ds.getRepository(DownloadArchive);
    await repo.upsert(
      {
        episodeId: ep.id,
        source: ep.source,
        quality,
        qualityRank: rank,
        sourceUrl: dl.url,
        s3Bucket: this.s3.bucket,
        s3Key: '',
        status: 'pending',
        error: null,
        sizeBytes: null,
      } as unknown as QueryDeepPartialEntity<DownloadArchive>,
      ['episodeId', 'qualityRank'],
    );
    return repo.findOneByOrFail({ episodeId: ep.id, qualityRank: rank });
  }

  private async markFailed(row: DownloadArchive, err: unknown): Promise<void> {
    const message = err instanceof Error ? err.message : String(err);
    await this.ds.getRepository(DownloadArchive).update(row.id, { status: 'failed', error: message });
  }
}
