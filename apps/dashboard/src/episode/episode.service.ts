import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';
import { Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { DEFAULT_LIMIT } from '../common/pagination';

export interface EpisodeDetail {
  episode: Episode;
  mirrors: Mirror[];
  downloads: DownloadLink[];
  mirrorsTotal: number;
  downloadsTotal: number;
  player: Mirror | null;
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
    return { episode, mirrors, downloads, mirrorsTotal, downloadsTotal, player };
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
