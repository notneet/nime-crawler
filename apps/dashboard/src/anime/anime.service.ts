import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, QueryDeepPartialEntity, Repository } from 'typeorm';
import { Anime, AnimeGenre, Genre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { DEFAULT_LIMIT } from '../common/pagination';

export interface AnimeList {
  rows: Anime[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnimeDetail {
  anime: Anime;
  episodes: Episode[];
  genres: Genre[];
}

export interface AnimeEpisodeList {
  anime: Anime;
  episodes: Episode[];
  total: number;
}

export interface AnimeMirrorRow {
  id: number;
  quality: string;
  host: string;
  streamUrl: string;
  episodeId: number | null;
  episodeTitle: string;
}

export interface AnimeMirrorList {
  anime: Anime;
  rows: AnimeMirrorRow[];
  total: number;
}

export interface AnimeDownloadRow {
  id: number;
  kind: string;
  quality: string;
  host: string;
  size: string;
  url: string;
  episodeId: number | null;
  episodeTitle: string;
}

export interface AnimeDownloadList {
  anime: Anime;
  rows: AnimeDownloadRow[];
  total: number;
}

export interface AnimeBatchRow {
  id: number;
  quality: string;
  host: string;
  size: string;
  url: string;
}

export interface AnimeBatchList {
  anime: Anime;
  rows: AnimeBatchRow[];
  total: number;
}

@Injectable()
export class AnimeService {
  constructor(
    @InjectRepository(Anime) private readonly anime: Repository<Anime>,
    @InjectRepository(AnimeGenre) private readonly animeGenre: Repository<AnimeGenre>,
    @InjectRepository(Genre) private readonly genre: Repository<Genre>,
    @InjectRepository(Episode) private readonly episode: Repository<Episode>,
    @InjectRepository(Mirror) private readonly mirror: Repository<Mirror>,
    @InjectRepository(DownloadLink) private readonly download: Repository<DownloadLink>,
  ) {}

  async list(q: string, page: number, pageSize = DEFAULT_LIMIT): Promise<AnimeList> {
    const where = q ? { title: Like(`%${q}%`) } : {};
    const [rows, total] = await this.anime.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { rows, total, page, pageSize };
  }

  async detail(id: number): Promise<AnimeDetail | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    const links = await this.animeGenre.findBy({ animeId: id });
    const genreIds = links.map((l) => l.genreId);
    const genres = genreIds.length ? await this.genre.findBy({ id: In(genreIds) }) : [];
    return { anime, episodes, genres };
  }

  async episodesOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeEpisodeList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const [episodes, total] = await this.episode.findAndCount({
      where: { animeUrl: anime.url },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { anime, episodes, total };
  }

  async mirrorsOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeMirrorList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const urls = episodes.map((e) => e.url);
    if (!urls.length) return { anime, rows: [], total: 0 };
    const [mirrors, total] = await this.mirror.findAndCount({
      where: { episodeUrl: In(urls) },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const rows = mirrors.map((m) => {
      const ep = byUrl.get(m.episodeUrl);
      return {
        id: m.id,
        quality: m.quality,
        host: m.host,
        streamUrl: m.streamUrl ?? '',
        episodeId: ep?.id ?? null,
        episodeTitle: ep?.title ?? '',
      };
    });
    return { anime, rows, total };
  }

  async downloadsOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeDownloadList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const urls = episodes.map((e) => e.url);
    if (!urls.length) return { anime, rows: [], total: 0 };
    const [downloads, total] = await this.download.findAndCount({
      where: { ownerUrl: In(urls) },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const rows = downloads.map((d) => {
      const ep = byUrl.get(d.ownerUrl);
      return {
        id: d.id,
        kind: d.kind,
        quality: d.quality ?? '',
        host: d.host ?? '',
        size: d.size ?? '',
        url: d.url,
        episodeId: ep?.id ?? null,
        episodeTitle: ep?.title ?? '',
      };
    });
    return { anime, rows, total };
  }

  // Batch downloads key on the /batch/ page URL, which has no DB link to the anime.
  // The only bridge is the detail-page discover output, persisted in anime.raw.batchLinks.
  async batchOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeBatchList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const raw = anime.raw as Record<string, unknown> | null | undefined;
    const linksRaw = raw?.['batchLinks'];
    const batchUrls = Array.isArray(linksRaw)
      ? linksRaw.filter((u): u is string => typeof u === 'string')
      : [];
    if (!batchUrls.length) return { anime, rows: [], total: 0 };
    const [downloads, total] = await this.download.findAndCount({
      where: { ownerUrl: In(batchUrls), kind: 'batch' },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const rows = downloads.map((d) => ({
      id: d.id,
      quality: d.quality ?? '',
      host: d.host ?? '',
      size: d.size ?? '',
      url: d.url,
    }));
    return { anime, rows, total };
  }

  async update(id: number, patch: Partial<Anime>): Promise<Anime | null> {
    await this.anime.update(id, patch as unknown as QueryDeepPartialEntity<Anime>);
    return this.anime.findOneBy({ id });
  }

  async remove(id: number): Promise<boolean> {
    const found = await this.anime.findOneBy({ id });
    if (!found) return false;
    await this.animeGenre.delete({ animeId: id });
    await this.anime.delete(id);
    return true;
  }
}
