import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostPatternService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostPatternDto: Prisma.PostPatternCreateInput) {
    try {
      const isAvailable = await this.findByMediaId(
        createPostPatternDto.media_id,
      );

      if (!isAvailable) {
        return this.prisma.postPattern.createMany({
          data: {
            media_id: createPostPatternDto.media_id,
            pattern: createPostPatternDto.pattern,
            pagination_pattern: createPostPatternDto.pagination_pattern,
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
      return this.prisma.postPattern.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number) {
    try {
      return this.prisma.postPattern.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByMediaId(id: number) {
    try {
      return this.prisma.postPattern.findUnique({ where: { media_id: id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validate(id: number) {
    try {
      const isAvailable = await this.findOne(id);
      const lastNStatus = isAvailable.n_status;

      if (isAvailable) {
        return this.prisma.postPattern.updateMany({
          where: { id },
          data: { n_status: Number(!lastNStatus) },
        });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: number,
    updatePostPatternDto: Prisma.PostPatternUpdateInput,
  ) {
    try {
      const postPattern = await this.findOne(id);

      if (postPattern) {
        return this.prisma.postPattern.updateMany({
          data: {
            media_id: updatePostPatternDto.media_id,
            pattern: updatePostPatternDto.pattern,
            pagination_pattern: updatePostPatternDto.pagination_pattern,
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
      const postPattern = await this.findOne(id);

      if (postPattern) {
        return this.prisma.postPattern.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
