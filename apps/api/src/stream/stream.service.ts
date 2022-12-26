import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import 'moment-timezone';
import { Stream } from '@libs/commons/dto/stream.dto';
import { InjectConnection } from '@nestjs/typeorm';
import { EnvKey } from '@libs/commons/helper/constant';
import { Connection } from 'typeorm';

@Injectable()
export class StreamService {
  private readonly streamTableName = 'stream';

  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conWatch: Connection,
  ) {}

  async create(createStreamDto: Stream) {
    try {
      const isAvailable = await this.findByUrl(createStreamDto.url);

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.streamTableName}_media_id`)
          .values({
            watch_id: createStreamDto.watch_id,
            author: createStreamDto.author,
            published: createStreamDto.published,
            published_ts: createStreamDto.published_ts,
            name: createStreamDto.name,
            url: createStreamDto.url,
            quality: createStreamDto.quality,
            file_size: createStreamDto.file_size,
            media_id: createStreamDto.media_id,
          } as Stream)
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

  async findAll(): Promise<Stream[]> {
    try {
      return this.baseQuery
        .from(`${this.streamTableName}_media_id`, 'q')
        .getRawMany()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlStream: string): Promise<Stream> {
    try {
      return this.baseQuery
        .from(`${this.streamTableName}_media_id`, 'q')
        .where({ url: urlStream })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<Stream> {
    try {
      return this.baseQuery
        .from(`${this.streamTableName}_media_id`, 'q')
        .where({ id })
        .execute()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(urlStream: string, updateStreamDto: Partial<Stream>) {
    try {
      const stream = await this.findByUrl(urlStream);

      if (stream) {
        return this.baseQuery
          .update(`${this.streamTableName}_media_id`)
          .set({
            watch_id: updateStreamDto.watch_id || stream.media_id,
            author: updateStreamDto.author || stream.author,
            published: updateStreamDto.published || stream.published,
            published_ts: updateStreamDto.published_ts || stream.published_ts,
            name: updateStreamDto.name || stream.name,
            url: updateStreamDto.url || stream.url,
            quality: updateStreamDto.quality || stream.quality,
            file_size: updateStreamDto.file_size || stream.file_size,
            media_id: updateStreamDto.media_id || stream.media_id,
          } as Partial<Stream>)
          .where({ url: urlStream })
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
      const stream = await this.findOne(id);

      if (stream) {
        return this.baseQuery
          .delete()
          .from(`${this.streamTableName}_media_id`)
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
