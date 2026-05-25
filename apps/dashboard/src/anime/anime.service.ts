import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Like, QueryDeepPartialEntity, Repository } from 'typeorm';
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
  aliases: Anime[];
  isAlias: boolean;
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

  private async resolveCanonicalAnime(id: number): Promise<Anime | null> {
    const anime = await this.anime.findOneBy({ id });
    if (!anime) return null;
    if (anime.canonicalId) return this.anime.findOneBy({ id: anime.canonicalId });
    return anime;
  }

  async list(q: string, page: number, pageSize = DEFAULT_LIMIT): Promise<AnimeList> {
    const where = q
      ? { title: Like(`%${q}%`), canonicalId: IsNull() }
      : { canonicalId: IsNull() };
    const [rows, total] = await this.anime.findAndCount({
      where,
      order: { id: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { rows, total, page, pageSize };
  }

  async detail(id: number): Promise<AnimeDetail | null> {
    const raw = await this.anime.findOneBy({ id });
    if (!raw) return null;
    const isAlias = !!raw.canonicalId;
    const anime = isAlias
      ? await this.anime.findOneBy({ id: raw.canonicalId! })
      : raw;
    if (!anime) return null;

    const aliases = await this.anime.findBy({ canonicalId: anime.id });
    const allUrls = [anime.url, ...aliases.map((a) => a.url)];

    const episodes = await this.episode.find({
      where: { animeUrl: In(allUrls) },
      order: { id: 'ASC' },
    });

    const links = await this.animeGenre.findBy({ animeId: anime.id });
    const genreIds = links.map((l) => l.genreId);
    const genres = genreIds.length ? await this.genre.findBy({ id: In(genreIds) }) : [];

    return { anime, episodes, genres, aliases, isAlias };
  }

  async episodesOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeEpisodeList | null> {
    const anime = await this.resolveCanonicalAnime(id);
    if (!anime) return null;
    const aliases = await this.anime.findBy({ canonicalId: anime.id });
    const allUrls = [anime.url, ...aliases.map((a) => a.url)];
    const [episodes, total] = await this.episode.findAndCount({
      where: { animeUrl: In(allUrls) },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { anime, episodes, total };
  }

  async mirrorsOf(id: number, page = 1, limit = DEFAULT_LIMIT): Promise<AnimeMirrorList | null> {
    const anime = await this.resolveCanonicalAnime(id);
    if (!anime) return null;
    const aliases = await this.anime.findBy({ canonicalId: anime.id });
    const allUrls = [anime.url, ...aliases.map((a) => a.url)];
    const episodes = await this.episode.findBy({ animeUrl: In(allUrls) });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const epUrls = episodes.map((e) => e.url);
    if (!epUrls.length) return { anime, rows: [], total: 0 };
    const [mirrors, total] = await this.mirror.findAndCount({
      where: { episodeUrl: In(epUrls) },
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
    const anime = await this.resolveCanonicalAnime(id);
    if (!anime) return null;
    const aliases = await this.anime.findBy({ canonicalId: anime.id });
    const allUrls = [anime.url, ...aliases.map((a) => a.url)];
    const episodes = await this.episode.findBy({ animeUrl: In(allUrls) });
    const byUrl = new Map(episodes.map((e) => [e.url, e]));
    const epUrls = episodes.map((e) => e.url);
    if (!epUrls.length) return { anime, rows: [], total: 0 };
    const [downloads, total] = await this.download.findAndCount({
      where: { ownerUrl: In(epUrls) },
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
    const anime = await this.resolveCanonicalAnime(id);
    if (!anime) return null;
    const aliases = await this.anime.findBy({ canonicalId: anime.id });
    const allAnime = [anime, ...aliases];
    const batchUrls: string[] = allAnime.flatMap((a) => {
      const raw = a.raw as Record<string, unknown> | null | undefined;
      const links = raw?.['batchLinks'];
      return Array.isArray(links) ? links.filter((u): u is string => typeof u === 'string') : [];
    });
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

  async link(aliasId: number, canonicalId: number): Promise<{ ok: boolean; error?: string }> {
    if (aliasId === canonicalId) return { ok: false, error: 'cannot link anime to itself' };
    const canonical = await this.anime.findOneBy({ id: canonicalId });
    if (!canonical) return { ok: false, error: 'canonical not found' };
    if (canonical.canonicalId) return { ok: false, error: 'no chain: canonical is itself an alias' };
    const alias = await this.anime.findOneBy({ id: aliasId });
    if (!alias) return { ok: false, error: 'alias not found' };
    const existingAliases = await this.anime.countBy({ canonicalId: aliasId });
    if (existingAliases > 0) return { ok: false, error: 'no chain: alias already has aliases pointing to it' };
    await this.anime.update(aliasId, { canonicalId } as unknown as QueryDeepPartialEntity<Anime>);
    return { ok: true };
  }

  async unlink(aliasId: number): Promise<boolean> {
    const alias = await this.anime.findOneBy({ id: aliasId });
    if (!alias || alias.canonicalId == null) return false;
    await this.anime.update(aliasId, { canonicalId: null } as unknown as QueryDeepPartialEntity<Anime>);
    return true;
  }

  async remove(id: number): Promise<boolean> {
    const found = await this.anime.findOneBy({ id });
    if (!found) return false;
    const aliasCount = await this.anime.countBy({ canonicalId: id });
    if (aliasCount > 0) return false;
    await this.animeGenre.delete({ animeId: id });
    await this.anime.delete(id);
    return true;
  }
}
