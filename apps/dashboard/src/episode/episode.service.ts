import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity, Repository } from 'typeorm';
import { Episode, Mirror, DownloadLink } from '@libs/commons/entities';

export interface EpisodeDetail {
  episode: Episode;
  mirrors: Mirror[];
  downloads: DownloadLink[];
}

@Injectable()
export class EpisodeService {
  constructor(
    @InjectRepository(Episode) private readonly episode: Repository<Episode>,
    @InjectRepository(Mirror) private readonly mirror: Repository<Mirror>,
    @InjectRepository(DownloadLink) private readonly download: Repository<DownloadLink>,
  ) {}

  async detail(id: number): Promise<EpisodeDetail | null> {
    const episode = await this.episode.findOneBy({ id });
    if (!episode) return null;
    const mirrors = await this.mirror.findBy({ episodeUrl: episode.url });
    const downloads = await this.download.findBy({ ownerUrl: episode.url });
    return { episode, mirrors, downloads };
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
