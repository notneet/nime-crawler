import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Anime, Episode, Mirror, DownloadLink, Genre } from '@libs/commons/entities';

export interface StatsSummary {
  counts: { anime: number; episode: number; mirror: number; download: number; genre: number };
  gaps: { animeMissingScore: number; animeMissingStudio: number; mirrorsUnresolved: number };
  newestAnimeUpdatedAt: Date | null;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Anime) private readonly anime: Repository<Anime>,
    @InjectRepository(Episode) private readonly episode: Repository<Episode>,
    @InjectRepository(Mirror) private readonly mirror: Repository<Mirror>,
    @InjectRepository(DownloadLink) private readonly download: Repository<DownloadLink>,
    @InjectRepository(Genre) private readonly genre: Repository<Genre>,
  ) {}

  async summary(): Promise<StatsSummary> {
    const [anime, episode, mirror, download, genre] = await Promise.all([
      this.anime.count(),
      this.episode.count(),
      this.mirror.count(),
      this.download.count(),
      this.genre.count(),
    ]);

    const animeMissingScore = await this.anime
      .createQueryBuilder('a')
      .where("a.score IS NULL OR a.score = ''")
      .getCount();
    const animeMissingStudio = await this.anime
      .createQueryBuilder('a')
      .where("a.studio IS NULL OR a.studio = ''")
      .getCount();
    const mirrorsUnresolved = await this.mirror.count({ where: { streamUrl: IsNull() } });

    const newest = await this.anime.findOne({ where: {}, order: { updatedAt: 'DESC' } });

    return {
      counts: { anime, episode, mirror, download, genre },
      gaps: { animeMissingScore, animeMissingStudio, mirrorsUnresolved },
      newestAnimeUpdatedAt: newest?.updatedAt ?? null,
    };
  }
}
