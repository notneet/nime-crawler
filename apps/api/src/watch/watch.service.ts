import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { Watch } from '@libs/commons/entities/watch.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';

@Injectable()
export class WatchService {
  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async saveToDB(createWatchDto: CreateWatchDto, mediaId: number) {
    try {
      const tableName = `watch_${mediaId}`;
      let watch = await this.findByUrlWithMediaId(createWatchDto.url, mediaId);

      if (!watch) {
        watch = this.watchEtityMetadata.create(createWatchDto);
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
    } catch (error) {}
  }

  async findAll(id: string) {
    const tableName = `watch_${id}`;

    try {
      return this.baseQuery(tableName).getRawMany();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrlWithMediaId(
    urlWatch: string,
    mediaId: number,
  ): Promise<Watch> {
    try {
      const tableName = `watch_${mediaId}`;

      return this.baseQuery(tableName)
        .where({ url: urlWatch } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
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
      throw new InternalServerErrorException(error);
    }
  }

  async findByObjectId(mediaId: string, objectId: string) {
    const tableName = `watch_${mediaId}`;
    let watch: Watch;

    try {
      watch = await this.baseQuery(tableName)
        .where({
          object_id: objectId,
        } as Partial<Watch>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!watch) {
      throw new NotFoundException('data not found');
    }

    return watch;
  }

  async findOne(mediaId: string, id: number) {
    const tableName = `watch_${mediaId}`;

    try {
      const watch = await this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ id } as Partial<Watch>)
        .getRawOne();
      if (!watch) throw new NotFoundException('data not found');

      return watch;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async create(createWatchDto: CreateWatchDto, mediaId?: string) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  async update(id: string, updateWatchDto: UpdateWatchDto) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  async remove(mediaId: string, id: string) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  private baseQuery(tableName: string) {
    return this.eManager.createQueryBuilder().from(tableName, 'q');
  }

  private get watchEtityMetadata() {
    return this.eManager.connection.getRepository(Watch);
  }
}
