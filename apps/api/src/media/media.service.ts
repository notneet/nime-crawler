import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { MediaDto } from '@libs/commons/dto/media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';
import { Media } from '@libs/commons/entities/media.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isNotEmptyObject } from 'class-validator';
import { EntityManager, Repository } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly conMedia: Repository<Media>,
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    try {
      let media = await this.findByUrlMedia(createMediaDto.url);

      if (!isNotEmptyObject(media)) {
        media = this.conMedia.create(createMediaDto);
        return this.conMedia.insert(media);
      }

      Object.assign(media, createMediaDto);
      return this.conMedia.update({ id: media.id }, media);
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
          .addSelect('COUNT(q.id)', 'watchesCount')
          .getRawOne()
      ).watchesCount;

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
    try {
      const media = await this.findByUrlMedia(urlMedia);

      if (!isNotEmptyObject(media)) {
        throw new NotFoundException('data not found');
      }
      Object.assign(media, updateMediaDto);

      return this.conMedia.update({ url: urlMedia }, media);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const media = await this.findOne(id);

      if (!media) throw new NotFoundException('data not found');

      return this.conMedia.remove(media);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
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
}
