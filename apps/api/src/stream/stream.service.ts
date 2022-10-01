import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import * as moment from 'moment';
import 'moment-timezone';

@Injectable()
export class StreamService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createStreamDto: Prisma.StreamCreateInput) {
    try {
      const isAvailable = await this.findByUrl(createStreamDto.url);

      if (!isAvailable) {
        return this.prisma.stream.createMany({
          data: {
            watch_id: createStreamDto.watch_id,
            author: createStreamDto.author,
            published: createStreamDto.published,
            published_ts: moment(createStreamDto.published).format('X'),
            name: createStreamDto.name,
            url: createStreamDto.url,
            quality: createStreamDto.quality,
            file_size: createStreamDto.file_size,
            media_id: createStreamDto.media_id,
          },
        });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll() {
    try {
      return this.prisma.stream.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUrl(urlStream: string) {
    try {
      return await this.prisma.stream.findUnique({ where: { url: urlStream } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.stream.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  update(id: number, updateStreamDto: UpdateStreamDto) {
    return `This action updates a #${id} stream`;
  }

  async remove(id: number) {
    try {
      const stream = await this.findOne(id);

      if (stream) {
        return this.prisma.stream.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
