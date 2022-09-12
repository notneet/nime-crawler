import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AnimeSource, Prisma } from '@prisma/client';

@Injectable()
export class AnimeSourceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAnimeSourceDto: Prisma.AnimeSourceCreateInput) {
    try {
      const isAvailable = await this.findByUrl(createAnimeSourceDto.url);

      if (!isAvailable) {
        return this.prisma.animeSource.createMany({
          data: {
            media_id: createAnimeSourceDto.media_id,
            url: createAnimeSourceDto.url,
            interval: createAnimeSourceDto.interval,
          },
        });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<AnimeSource[]> {
    try {
      return this.prisma.animeSource.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlSource: string): Promise<AnimeSource> {
    try {
      return this.prisma.animeSource.findUnique({ where: { url: urlSource } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validate(id: number) {
    try {
      const isAvailable = await this.findOne(id);
      const lastNStatus = isAvailable.n_status;

      if (isAvailable) {
        return this.prisma.animeSource.updateMany({
          where: { id },
          data: { n_status: Number(!lastNStatus) },
        });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<AnimeSource> {
    try {
      return this.prisma.animeSource.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: number,
    updateAnimeSourceDto: Prisma.AnimeSourceUpdateInput,
  ) {
    try {
      const isAvailable = await this.findOne(id);

      if (isAvailable) {
        return this.prisma.animeSource.updateMany({
          data: {
            media_id: updateAnimeSourceDto.media_id,
            url: updateAnimeSourceDto.url,
            interval: updateAnimeSourceDto.interval,
            n_status: 0,
          },
          where: { id },
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
        return this.prisma.animeSource.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
