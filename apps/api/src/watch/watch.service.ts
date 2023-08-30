import { CreateWatchDto } from '@libs/commons/dto/create/create-watch.dto';
import { UpdateWatchDto } from '@libs/commons/dto/update/update-watch.dto';
import { Watch } from '@libs/commons/entities/watch.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class WatchService {
  constructor(
    @InjectRepository(Watch)
    private readonly conWatch: Repository<Watch>,
    @InjectConnection('default')
    private readonly con: Connection,
  ) {}

  async saveToDB(createWatchDto: CreateWatchDto, mediaId: number) {
    try {
      const tableName = `watch_${mediaId}`;
      let watch = await this.findByUrlWithMediaId(createWatchDto.url, mediaId);

      if (!watch) {
        watch = this.conWatch.create(createWatchDto);
        return this.con
          .createQueryBuilder()
          .insert()
          .into(tableName)
          .values(watch)
          .execute();
      }
      Object.assign(watch, createWatchDto);
      delete watch.updated_at;

      return this.conWatch
        .createQueryBuilder()
        .update(tableName)
        .set(watch)
        .where({ id: watch.id })
        .execute();
    } catch (error) {}
  }

  async findByUrlWithMediaId(
    urlWatch: string,
    mediaId: number,
  ): Promise<Watch> {
    try {
      const tableName = `watch_${mediaId}`;

      return this.con
        .createQueryBuilder()
        .from(tableName, 'q')
        .where({ url: urlWatch } as Watch)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async create(createWatchDto: CreateWatchDto, id?: number) {
    try {
      let watch = await this.findByUrl(createWatchDto.url);

      if (!watch) {
        watch = this.conWatch.create(createWatchDto);
        return this.conWatch.insert(watch);
      }
      Object.assign(watch, createWatchDto);

      return this.conWatch.update({ id: watch.id }, watch);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(id: string) {
    try {
      return this.conWatch
        .createQueryBuilder()
        .from(`watch_${id}`, 'watch')
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrl(urlWatch: string) {
    try {
      return this.conWatch.findOne({
        where: {
          url: urlWatch,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByObjectId(objectId: string) {
    try {
      const watch = await this.conWatch.findOne({
        where: { object_id: objectId },
      });
      if (!watch) throw new NotFoundException('data not found');

      return watch;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      const watch = await this.conWatch.findOne({ where: { id } });
      if (!watch) throw new NotFoundException('data not found');

      return watch;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: string, updateWatchDto: UpdateWatchDto) {
    try {
      const watch = await this.findByObjectId(id);
      Object.assign(watch, updateWatchDto);

      return this.conWatch.update({ object_id: id }, watch);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: string) {
    try {
      const watch = await this.findByObjectId(id);

      return this.conWatch.remove(watch);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
