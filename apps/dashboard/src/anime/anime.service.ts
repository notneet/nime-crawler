import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, QueryDeepPartialEntity, Repository } from 'typeorm';
import { Anime, AnimeGenre, Genre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';

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

  async list(q: string, page: number, pageSize = 20): Promise<AnimeList> {
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

  async episodesOf(id: number): Promise<AnimeEpisodeList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    return { anime, episodes };
  }

  async mirrorsOf(id: number): Promise<AnimeMirrorList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const urls = episodes.map((e) => e.url);
    const mirrors = urls.length ? await this.mirror.findBy({ episodeUrl: In(urls) }) : [];
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
    return { anime, rows };
  }

  async downloadsOf(id: number): Promise<AnimeDownloadList | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    const episodes = await this.episode.findBy({ animeUrl: anime.url });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const urls = episodes.map((e) => e.url);
    const downloads = urls.length ? await this.download.findBy({ ownerUrl: In(urls) }) : [];
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
    return { anime, rows };
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
