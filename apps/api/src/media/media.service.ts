import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { MediaDto } from '@libs/commons/dto/media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';
import { Media } from '@libs/commons/entities/media.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isNotEmptyObject } from 'class-validator';
import { EntityManager } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    try {
      const tableName = `media`;
      let media = await this.findByUrlMedia(createMediaDto.url);

      if (!isNotEmptyObject(media)) {
        media = this.mediaEtityMetadata.create(createMediaDto);
        return this.mediaEtityMetadata
          .createQueryBuilder()
          .insert()
          .into(tableName)
          .values(media)
          .execute();
      }

      Object.assign(media, createMediaDto);
      return this.mediaEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(media)
        .where({ id: media.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(pageOptDto: PageOptionsDto): Promise<PageDto<MediaDto[]>> {
    const tableName = `media`;

    try {
      const data = await this.baseQuery(tableName)
        .orderBy('q.name', pageOptDto?.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getRawMany();
      const itemCount = +(
        await this.baseQuery(tableName)
          .orderBy('q.name', pageOptDto?.order)
          .addSelect('COUNT(q.id)', 'mediasCount')
          .getRawOne()
      ).mediasCount;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(MediaDto, data),
        meta: pageMetaDto,
      };
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `table ${tableName} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findByUrl(urlMedia: string): Promise<PageDto<MediaDto>> {
    const tableName = `media`;
    let media: Media | undefined;

    try {
      media = await this.baseQuery(tableName)
        .where({
          url: urlMedia,
        } as Partial<Media>)
        .getRawOne();
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `table ${tableName} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }

    if (!media) {
      throw new NotFoundException('data not found');
    }

    return {
      data: plainToInstance(MediaDto, media),
    };
  }

  async findByUrlMedia(urlMedia: string) {
    const tableName = `media`;

    try {
      return this.baseQuery(tableName)
        .where({ url: urlMedia } as Partial<Media>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(urlMedia: string, updateMediaDto: UpdateMediaDto) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  async remove(id: number) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  /**
   *
   */

  private async findOne(id: number): Promise<Media | null | undefined> {
    const tableName = `media`;

    try {
      return this.baseQuery(tableName).where({ id }).getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private baseQuery(tableName: string) {
    return this.eManager.createQueryBuilder().from(tableName, 'q');
  }

  private get mediaEtityMetadata() {
    return this.eManager.connection.getRepository(Media);
  }
}
