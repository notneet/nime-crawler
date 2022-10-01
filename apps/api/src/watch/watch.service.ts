import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable()
export class WatchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createWatchDto: Prisma.WatchCreateInput) {
    try {
      const isAvailable = await this.findByUrl(createWatchDto.url);
      const now = moment().add(7, 'h');

      if (!isAvailable) {
        return this.prisma.watch.createMany({
          data: {
            url: createWatchDto.url,
            title: createWatchDto.title,
            title_jp: createWatchDto?.title_jp,
            title_en: createWatchDto?.title_en,
            type: createWatchDto.type,
            score: createWatchDto.score,
            status: createWatchDto.status,
            duration: createWatchDto.duration,
            total_episode: createWatchDto.total_episode,
            published: createWatchDto.published,
            published_ts: moment(createWatchDto.published).format('X'),
            season: createWatchDto.season,
            genres: createWatchDto.genres,
            producers: createWatchDto.producers,
            description: createWatchDto.description,
            created_at: now.toDate(),
            updated_at: now.toDate(),
            cover_url: createWatchDto.cover_url,
            media_id: createWatchDto.media_id,
          },
          skipDuplicates: true,
        });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll() {
    try {
      return this.prisma.watch.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlWatch: string) {
    try {
      return this.prisma.watch.findUnique({ where: { url: urlWatch } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      return this.prisma.watch.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updateWatchDto: Prisma.WatchUpdateInput) {
    try {
      const watch = await this.findOne(id);
      const now = moment().add(7, 'h');

      if (watch) {
        return this.prisma.watch.updateMany({
          data: {
            url: updateWatchDto.url,
            title: updateWatchDto.title,
            title_jp: updateWatchDto?.title_jp,
            title_en: updateWatchDto?.title_en,
            type: updateWatchDto.type,
            score: updateWatchDto.score,
            status: updateWatchDto.status,
            duration: updateWatchDto.duration,
            total_episode: updateWatchDto.total_episode,
            published: updateWatchDto.published,
            published_ts: moment(updateWatchDto.published.toString()).format(
              'X',
            ),
            season: updateWatchDto.season,
            genres: updateWatchDto.genres,
            producers: updateWatchDto.producers,
            description: updateWatchDto.description,
            created_at: now.toDate(),
            updated_at: now.toDate(),
            cover_url: updateWatchDto.cover_url,
            media_id: updateWatchDto.media_id,
          },
        });
      }
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: number) {
    try {
      const watch = await this.findOne(id);

      if (watch) {
        return this.prisma.watch.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
