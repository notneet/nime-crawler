import { PostPattern } from '@libs/commons/dto/post-pattern.dto';
import { EnvKey } from '@libs/commons/helper/constant';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class PostPatternService {
  private readonly PostPatternTableName = 'post_pattern';
  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conPostPattern: Connection,
  ) {}

  async create(createPostPatternDto: PostPattern) {
    try {
      const isAvailable = await this.findByMediaId(
        createPostPatternDto.media_id,
      );

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.PostPatternTableName}`)
          .values({
            media_id: createPostPatternDto.media_id,
            pattern: createPostPatternDto.pattern,
            pagination_pattern: createPostPatternDto.pagination_pattern,
            n_status: 1,
          } as PostPattern)
          .orUpdate(['pattern', 'pagination_pattern'], ['media_id'])
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data already exists', HttpStatus.CONFLICT);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<PostPattern[]> {
    try {
      return this.baseQuery
        .from(`${this.PostPatternTableName}`, 'q')
        .getRawMany()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<PostPattern> {
    try {
      return this.baseQuery
        .from(`${this.PostPatternTableName}`, 'q')
        .where({ id })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByMediaId(id: number): Promise<PostPattern> {
    try {
      return this.baseQuery
        .from(`${this.PostPatternTableName}`, 'q')
        .where({ media_id: id })
        .getRawOne()
        .catch((e) => {
          throw e;
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
        return this.baseQuery
          .update(`${this.PostPatternTableName}`)
          .set({ n_status: Number(!lastNStatus) } as Partial<PostPattern>)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, updatePostPatternDto: Partial<PostPattern>) {
    try {
      const { media_id, pattern, pagination_pattern, n_status } =
        await this.findOne(id);

      if (media_id) {
        return this.baseQuery
          .update(`${this.PostPatternTableName}`)
          .set({
            media_id: updatePostPatternDto.media_id || media_id,
            pattern: updatePostPatternDto.pattern || pattern,
            pagination_pattern:
              updatePostPatternDto.pagination_pattern || pagination_pattern,
            n_status: updatePostPatternDto.n_status || n_status,
          } as Partial<PostPattern>)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
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
        return this.baseQuery
          .delete()
          .from(`${this.PostPatternTableName}`)
          .where({ id })
          .execute()
          .catch((e) => {
            throw e;
          });
      }

      throw new HttpException('Data not found', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private get baseQuery() {
    return this.conPostPattern.createQueryBuilder();
  }
}
