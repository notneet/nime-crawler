import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { WatchDto } from '@libs/commons/dto/watch.dto';
import { Watch } from '@libs/commons/entities/watch.entity';
import { hashUUID } from '@libs/commons/helper/md5';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { isNotEmpty } from 'class-validator';
import { EntityManager, Like } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class WatchService {
  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async saveToDB(
    createWatchDto: CreateWatchDto,
    mediaId: number,
    oldOrigin?: string | null | undefined,
  ) {
    let watch: Watch | undefined;
    try {
      const tableName = `watch_${mediaId}`;

      watch = await this.findByObjectIdWithMediaId(
        [
          String(this.makeOldObjectId(oldOrigin, createWatchDto?.url)),
          String(createWatchDto?.object_id),
        ],
        mediaId,
      );

      if (!watch) {
        watch = this.watchEtityMetadata.create(
          createWatchDto as unknown as Watch,
        );
        return this.watchEtityMetadata
          .createQueryBuilder()
          .insert()
          .into(tableName)
          .values(watch)
          .execute();
      }
      Object.assign(watch, createWatchDto);
      delete watch.updated_at;

      return this.watchEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(watch)
        .where({ id: watch.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(
    mediaId: string,
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<WatchDto[]>> {
    const tableName = `watch_${mediaId}`;

    try {
      const data = await this.baseQuery(tableName, pageOptDto?.search)
        .orderBy('q.updated_at', pageOptDto?.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getRawMany();
      const itemCount = +(
        await this.baseQuery(tableName, pageOptDto?.search)
          .orderBy('q.updated_at', pageOptDto?.order)
          .addSelect('COUNT(q.id)', 'watchesCount')
          .getRawOne()
      ).watchesCount;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(WatchDto, data),
        meta: pageMetaDto,
      };
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findByUrl(mediaId: string, urlWatch: string) {
    const tableName = `watch_${mediaId}`;

    try {
      return this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ url: urlWatch } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findByObjectId(
    mediaId: string,
    objectId: string,
  ): Promise<PageDto<WatchDto>> {
    const tableName = `watch_${mediaId}`;
    let watch: Watch | undefined;

    try {
      watch = await this.baseQuery(tableName)
        .where({
          object_id: objectId,
        } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }

    if (!watch) {
      throw new NotFoundException('data not found');
    }

    return {
      data: plainToInstance(WatchDto, watch),
    };
  }

  async findOne(mediaId: string, id: number) {
    let watch: Watch | undefined;
    const tableName = `watch_${mediaId}`;

    try {
      watch = await this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ id } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!watch) throw new NotFoundException('data not found');

    return watch;
  }

  async create(createWatchDto: CreateWatchDto, mediaId?: string) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  async update(
    mediaId: string,
    objectId: string,
    updateWatchDto: UpdateWatchDto,
  ) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  async remove(mediaId: string, objectId: string) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  /**
   *
   */

  private async findByUrlWithMediaId(
    urlWatch: string,
    mediaId: number,
  ): Promise<Watch | undefined> {
    const tableName = `watch_${mediaId}`;

    try {
      return this.baseQuery(tableName)
        .where({ url: urlWatch } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private async findByObjectIdWithMediaId(
    objectId: string[],
    mediaId: number,
  ): Promise<Watch | undefined> {
    const tableName = `watch_${mediaId}`;

    try {
      return this.baseQuery(tableName)
        .where({ object_id: objectId[0] } as Partial<Watch>)
        .orWhere({ object_id: objectId[1] } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private baseQuery(tableName: string, search?: string) {
    const query = this.eManager.createQueryBuilder().from(tableName, 'q');
    if (isNotEmpty(search)) return query.where({ title: Like(`%${search}%`) });

    return query;
  }

  private get watchEtityMetadata() {
    return this.eManager.connection.getRepository(Watch);
  }

  private makeOldObjectId(
    oldOrigin: string | null | undefined,
    currentUrl: string,
  ) {
    if (!/^https?:\/\//.test(currentUrl)) return null;

    const extractedUrl = new URL(currentUrl);
    const { protocol, host, pathname } = extractedUrl;
    const mixedOrigin = host !== oldOrigin ? oldOrigin : host;

    return hashUUID(`${protocol}//${mixedOrigin}${pathname}`);
  }
}
