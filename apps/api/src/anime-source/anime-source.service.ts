import { AnimeSource } from '@libs/commons/dto/anime-souce.dto';
import { EnvKey } from '@libs/commons/helper/constant';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class AnimeSourceService {
  private readonly animeSourceTableName = 'anime_source';

  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conAnimeSource: Connection,
  ) {}

  async create(createAnimeSourceDto: AnimeSource) {
    try {
      const isAvailable = await this.findByUrl(createAnimeSourceDto.url);

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.animeSourceTableName}`)
          .values({
            media_id: createAnimeSourceDto.media_id,
            url: createAnimeSourceDto.url,
            interval: createAnimeSourceDto.interval,
            n_status: 1,
          } as AnimeSource)
          .orUpdate(['media_id', 'interval', 'n_status'], ['url'])
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<AnimeSource[]> {
    try {
      return this.baseQuery
        .from(`${this.animeSourceTableName}`, 'q')
        .getRawMany()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlSource: string): Promise<AnimeSource> {
    try {
      return this.baseQuery
        .from(`${this.animeSourceTableName}`, 'q')
        .where({ url: urlSource } as Partial<AnimeSource>)
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validate(id: number) {
    try {
      const isAvailable = await this.findOne(id);
      const lastNStatus = isAvailable.n_status;

      if (isAvailable) {
        return this.baseQuery
          .update(`${this.animeSourceTableName}`)
          .set({ n_status: Number(!lastNStatus) } as Partial<AnimeSource>)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<AnimeSource> {
    try {
      return this.baseQuery
        .from(`${this.animeSourceTableName}`, 'q')
        .where({ id })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateAnimeSourceDto: Partial<AnimeSource>) {
    try {
      const isAvailable = await this.findOne(id);

      if (isAvailable) {
        return this.baseQuery
          .update(`${this.animeSourceTableName}`)
          .set({
            media_id: updateAnimeSourceDto.media_id,
            url: updateAnimeSourceDto.url,
            interval: updateAnimeSourceDto.interval,
            n_status: updateAnimeSourceDto.n_status,
          } as Partial<AnimeSource>)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number) {
    try {
      const animeSource = await this.findOne(id);

      if (animeSource) {
        return this.baseQuery
          .delete()
          .from(`${this.animeSourceTableName}`)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private get baseQuery() {
    return this.conAnimeSource.createQueryBuilder();
  }
}
