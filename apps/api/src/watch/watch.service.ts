import { Watch } from '@libs/commons/dto/watch.dto';
import { EnvKey } from '@libs/commons/helper/constant';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class WatchService {
  private readonly watchTableName = 'watch';

  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conWatch: Connection,
  ) {}

  async create(createWatchDto: Watch) {
    try {
      const isAvailable = await this.findByUrl(createWatchDto.url);

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.watchTableName}_media_id`)
          .values({
            media_id: createWatchDto.media_id,
            url: createWatchDto.url,
            cover_url: createWatchDto.cover_url,
            description: createWatchDto.description,
            duration: createWatchDto.duration,
            genres: createWatchDto.genres,
            producers: createWatchDto.producers,
            published: createWatchDto.published,
            published_ts: createWatchDto.published_ts,
            score: createWatchDto.score,
            season: createWatchDto.season,
            status: createWatchDto.status,
            title: createWatchDto.title,
            title_en: createWatchDto.title_en,
            title_jp: createWatchDto.title_jp,
            total_episode: createWatchDto.total_episode,
            type: createWatchDto.type,
          } as Watch)
          .orUpdate(
            [
              'cover_url',
              'description',
              'duration',
              'genres',
              'producers',
              'published',
              'published_ts',
              'score',
              'season',
              'status',
              'title',
              'title_en',
              'title_jp',
              'total_episode',
              'type',
            ],
            ['url'],
          )
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

  async findAll(): Promise<Watch[]> {
    try {
      return this.baseQuery
        .from(`${this.watchTableName}_media_id`, 'q')
        .getRawMany()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlWatch: string): Promise<Watch> {
    try {
      return this.baseQuery
        .from(`${this.watchTableName}_media_id`, 'q')
        .where({ url: urlWatch })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<Watch> {
    try {
      return this.baseQuery
        .from(`${this.watchTableName}_media_id`, 'q')
        .where({ id })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateWatchDto: Partial<Watch>) {
    try {
      const watch = await this.findOne(id);

      if (watch) {
        return this.baseQuery
          .update(`${this.watchTableName}_media_id`)
          .set({
            url: updateWatchDto.url || watch.url,
            title: updateWatchDto.title || watch.title,
            title_jp: updateWatchDto?.title_jp || watch.title_jp,
            title_en: updateWatchDto?.title_en || watch.title_en,
            type: updateWatchDto.type || watch.type,
            score: updateWatchDto.score || watch.score,
            status: updateWatchDto.status || watch.status,
            duration: updateWatchDto.duration || watch.duration,
            total_episode: updateWatchDto.total_episode || watch.total_episode,
            published: updateWatchDto.published || watch.published,
            published_ts: updateWatchDto.published || watch.published,
            season: updateWatchDto.season || watch.season,
            genres: updateWatchDto.genres || watch.genres,
            producers: updateWatchDto.producers || watch.producers,
            description: updateWatchDto.description || watch.description,
            cover_url: updateWatchDto.cover_url || watch.cover_url,
            media_id: updateWatchDto.media_id || watch.media_id,
          } as Partial<Watch>)
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
      const watch = await this.findOne(id);

      if (watch) {
        return this.baseQuery
          .delete()
          .from(`${this.watchTableName}_media_id`)
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
    return this.conWatch.createQueryBuilder();
  }
}
