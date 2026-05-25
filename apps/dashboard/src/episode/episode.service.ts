import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Episode, Mirror, DownloadLink, DownloadArchive } from '@libs/commons/entities';
import { EXCHANGES, routingKey } from '@libs/commons/messaging/exchanges';
import { DownloadJobDto } from '@libs/commons/messaging/download-job.dto';
import { DEFAULT_LIMIT } from '../common/pagination';

export interface ArchiveView {
  quality: string;
  status: string;
  sizeHuman: string;
  s3Key: string;
  error: string;
}

export interface EpisodeDetail {
  episode: Episode;
  mirrors: Mirror[];
  downloads: DownloadLink[];
  mirrorsTotal: number;
  downloadsTotal: number;
  player: Mirror | null;
  archives: ArchiveView[];
}

function humanBytes(n: number | null): string {
  if (n === null || !Number.isFinite(n) || n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function pickBestMirror(mirrors: Mirror[]): Mirror | null {
  // Highest resolution wins; ties break to the latest (highest id) row.
  return (
    mirrors
      .filter((m) => m.streamUrl)
      .sort(
        (a, b) =>
          (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0) || b.id - a.id,
      )[0] ?? null
  );
}

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode) private readonly episode: Repository<Episode>,
    @InjectRepository(Mirror) private readonly mirror: Repository<Mirror>,
    @InjectRepository(DownloadLink) private readonly download: Repository<DownloadLink>,
    @InjectRepository(DownloadArchive) private readonly archiveRepo: Repository<DownloadArchive>,
    private readonly amqp: AmqpConnection,
  ) {}

  async detail(
    id: number,
    mPage = 1,
    mLimit = DEFAULT_LIMIT,
    dPage = 1,
    dLimit = DEFAULT_LIMIT,
  ): Promise<EpisodeDetail | null> {
    const episode = await this.episode.findOneBy({ id });
    if (!episode) return null;
    const [mirrors, mirrorsTotal] = await this.mirror.findAndCount({
      where: { episodeUrl: episode.url },
      order: { id: 'ASC' },
      skip: (mPage - 1) * mLimit,
      take: mLimit,
    });
    const [downloads, downloadsTotal] = await this.download.findAndCount({
      where: { ownerUrl: episode.url },
      order: { id: 'ASC' },
      skip: (dPage - 1) * dLimit,
      take: dLimit,
    });
    const allMirrors = await this.mirror.findBy({ episodeUrl: episode.url });
    const player = pickBestMirror(allMirrors);
    const archiveRows = await this.archiveRepo.findBy({ episodeId: episode.id });
    const archives = archiveRows.map((a) => ({
      quality: a.quality,
      status: a.status,
      sizeHuman: humanBytes(a.sizeBytes ? Number(a.sizeBytes) : null),
      s3Key: a.s3Key,
      error: a.error ?? '',
    }));
    return { episode, mirrors, downloads, mirrorsTotal, downloadsTotal, player, archives };
  }

  async resolvableMirrors(id: number): Promise<{
    episodeId: number;
    mirrors: { id: number; quality: string; host: string }[];
    highest: { id: number; quality: string } | null;
    lowest: { id: number; quality: string } | null;
    episodeStreamUrl: string | null;
  } | null> {
    const ep = await this.episode.findOneBy({ id });
    if (!ep) return null;
    const all = await this.mirror.findBy({ episodeUrl: ep.url });
    const mirrors = all
      .filter((m) => m.streamUrl)
      .sort((a, b) => (parseInt(b.quality, 10) || 0) - (parseInt(a.quality, 10) || 0) || b.id - a.id)
      .map((m) => ({ id: m.id, quality: m.quality, host: m.host }));
    // Sorted high→low: first is the highest quality, last is the lowest.
    const highest = mirrors[0] ? { id: mirrors[0].id, quality: mirrors[0].quality } : null;
    const last = mirrors.at(-1);
    const lowest = last ? { id: last.id, quality: last.quality } : null;
    return { episodeId: ep.id, mirrors, highest, lowest, episodeStreamUrl: ep.streamUrl ?? null };
  }

  async archive(
    id: number,
    opts: { mirrorId?: number; episodeStream?: boolean; faststart?: boolean } = {},
  ): Promise<{ ok: boolean; message: string }> {
    const ep = await this.episode.findOneBy({ id });
    if (!ep) return { ok: false, message: 'episode not found' };
    // Resolve the stream URL server-side from the episode (never trust a client URL).
    let streamUrl: string | undefined;
    if (opts.episodeStream) {
      if (!ep.streamUrl) return { ok: false, message: 'episode has no stream url' };
      streamUrl = ep.streamUrl;
    }
    await this.amqp.publish(
      EXCHANGES.download,
      routingKey('download', 'episode', ep.source),
      { episodeId: ep.id, source: ep.source, manual: true, mirrorId: opts.mirrorId, streamUrl, faststart: opts.faststart } satisfies DownloadJobDto,
    );
    return { ok: true, message: `archive job queued | ${ep.url}` };
  }

  async update(id: number, patch: Partial<Episode>): Promise<Episode | null> {
    await this.episode.update(id, patch as unknown as QueryDeepPartialEntity<Episode>);
    return this.episode.findOneBy({ id });
  }

  async remove(id: number): Promise<boolean> {
    const found = await this.episode.findOneBy({ id });
    if (!found) return false;
    await this.mirror.delete({ episodeUrl: found.url });
    await this.episode.delete(id);
    return true;
  }

  async deleteMirror(id: number): Promise<boolean> {
    const res = await this.mirror.delete(id);
    return (res.affected ?? 0) > 0;
  }

  async deleteDownload(id: number): Promise<boolean> {
    const res = await this.download.delete(id);
    return (res.affected ?? 0) > 0;
  }
}
