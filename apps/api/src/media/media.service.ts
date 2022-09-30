import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Media, Prisma } from '@prisma/client';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMediaDto: Prisma.MediaCreateInput) {
    try {
      const isAvailable = await this.findByUrl(createMediaDto.url);

      if (!isAvailable) {
        return this.prisma.media.createMany({
          data: {
            name: createMediaDto.name,
            url: createMediaDto.url,
          },
          skipDuplicates: true,
        });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<Media[]> {
    try {
      return this.prisma.media.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlMedia: string): Promise<Media> {
    try {
      return this.prisma.media.findUnique({ where: { url: urlMedia } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<Media> {
    try {
      return this.prisma.media.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(urlMedia: string, updateMediaDto: Prisma.MediaUpdateInput) {
    try {
      const media = await this.findByUrl(urlMedia);

      if (media) {
        return this.prisma.media.updateMany({
          data: {
            name: updateMediaDto.name,
            url: updateMediaDto.url,
          },
          where: { url: urlMedia },
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
        return this.prisma.media.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
