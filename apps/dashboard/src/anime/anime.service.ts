import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, QueryDeepPartialEntity, Repository } from 'typeorm';
import { Anime, AnimeGenre, Genre, Episode } from '@libs/commons/entities';

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

@Injectable()
export class AnimeService {
  constructor(
    @InjectRepository(Anime) private readonly anime: Repository<Anime>,
    @InjectRepository(AnimeGenre) private readonly animeGenre: Repository<AnimeGenre>,
    @InjectRepository(Genre) private readonly genre: Repository<Genre>,
    @InjectRepository(Episode) private readonly episode: Repository<Episode>,
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
