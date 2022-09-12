import { PrismaService } from '@libs/commons/prisma/prisma.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostPatternDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPostPatternDetailDto: Prisma.PostDetailPatternCreateInput,
  ) {
    try {
      const isAvailable = await this.findByMediaId(
        createPostPatternDetailDto.media_id,
      );

      if (!isAvailable) {
        return this.prisma.postDetailPattern.createMany({
          data: {
            media_id: createPostPatternDetailDto.media_id,
            pattern: createPostPatternDetailDto.pattern,
            episode_pattern: createPostPatternDetailDto.episode_pattern,
          },
        });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  findAll() {
    try {
      return this.prisma.postDetailPattern.findMany();
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  findOne(id: number) {
    try {
      return this.prisma.postDetailPattern.findUnique({ where: { id } });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByMediaId(id: number) {
    try {
      return this.prisma.postDetailPattern.findUnique({
        where: { media_id: id },
      });
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
    updatePostPatternDetailDto: Prisma.PostDetailPatternUpdateInput,
  ) {
    try {
      const postDetailPattern = await this.findOne(id);

      if (postDetailPattern) {
        return this.prisma.postDetailPattern.updateMany({
          data: {
            media_id: updatePostPatternDetailDto.media_id,
            pattern: updatePostPatternDetailDto.pattern,
            episode_pattern: updatePostPatternDetailDto.episode_pattern,
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
        return this.prisma.postDetailPattern.deleteMany({ where: { id } });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
