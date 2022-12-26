import { EnvKey } from '@libs/commons/helper/constant';
import { Media } from '@libs/commons/dto/media.dto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class MediaService {
  private readonly mediaTableName = 'media';

  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conMedia: Connection,
  ) {}

  async create(createMediaDto: Partial<Media>) {
    try {
      const isAvailable = await this.findByUrl(createMediaDto.url);

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.mediaTableName}`)
          .values({
            name: createMediaDto.name,
            url: createMediaDto.url,
          } as Partial<Media>)
          .orUpdate(['name'], ['url'])
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

  async findAll(): Promise<Media[]> {
    try {
      return this.baseQuery.from(`${this.mediaTableName}`, 'q').getRawMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlMedia: string): Promise<Media> {
    try {
      return this.baseQuery
        .from(`${this.mediaTableName}`, 'q')
        .where({ url: urlMedia } as Media)
        .getRawOne();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<Media> {
    try {
      return this.baseQuery
        .from(`${this.mediaTableName}`, 'q')
        .where({ id })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(urlMedia: string, updateMediaDto: Partial<Media>) {
    try {
      const media = await this.findByUrl(urlMedia);

      if (media) {
        return this.baseQuery
          .update(`${this.mediaTableName}`)
          .set({
            name: updateMediaDto?.name,
            url: updateMediaDto?.url,
          } as Partial<Media>)
          .where({ url: urlMedia })
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
      const media = await this.findOne(id);

      if (media) {
        return this.baseQuery
          .delete()
          .from(`${this.mediaTableName}`, 'q')
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
    return this.conMedia.createQueryBuilder();
  }
}
