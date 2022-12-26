import { PatternPostDetail } from '@libs/commons/dto/post-pattern-detail.dto';
import { EnvKey } from '@libs/commons/helper/constant';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class PostPatternDetailService {
  private readonly postPatternDetailTableName = 'post_detail_pattern';

  constructor(
    @InjectConnection(EnvKey.DATABASE_URL)
    private readonly conPostPatternDetail: Connection,
  ) {}

  async create(createPostPatternDetailDto: PatternPostDetail) {
    try {
      const isAvailable = await this.findByMediaId(
        createPostPatternDetailDto.media_id,
      );

      if (!isAvailable) {
        return this.baseQuery
          .insert()
          .into(`${this.postPatternDetailTableName}`)
          .values({
            media_id: createPostPatternDetailDto.media_id,
            pattern: createPostPatternDetailDto?.pattern,
            episode_pattern: createPostPatternDetailDto.episode_pattern,
            n_status: 1,
          } as PatternPostDetail)
          .orUpdate(['pattern', 'episode_pattern'], ['media_id'])
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

  async findAll(): Promise<PatternPostDetail[]> {
    try {
      return this.baseQuery
        .from(`${this.postPatternDetailTableName}`, 'q')
        .getRawMany()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: number): Promise<PatternPostDetail> {
    try {
      return this.baseQuery
        .from(`${this.postPatternDetailTableName}`, 'q')
        .where({ id })
        .getRawOne()
        .catch((e) => {
          throw e;
        });
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByMediaId(id: number): Promise<PatternPostDetail> {
    try {
      return this.baseQuery
        .from(`${this.postPatternDetailTableName}`, 'q')
        .where({ id })
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
          .update(`${this.postPatternDetailTableName}`)
          .set({ n_status: Number(!lastNStatus) } as Partial<PatternPostDetail>)
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

  async update(
    id: number,
    updatePostPatternDetailDto: Partial<PatternPostDetail>,
  ) {
    try {
      const { media_id, pattern, episode_pattern, n_status } =
        await this.findOne(id);

      if (media_id) {
        return this.baseQuery
          .update(`${this.postPatternDetailTableName}`)
          .set({
            media_id: updatePostPatternDetailDto?.media_id || media_id,
            pattern: updatePostPatternDetailDto?.pattern || pattern,
            episode_pattern:
              updatePostPatternDetailDto?.episode_pattern || episode_pattern,
            n_status: updatePostPatternDetailDto?.n_status || n_status,
          } as Partial<PatternPostDetail>)
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
          .from(`${this.postPatternDetailTableName}`)
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
    return this.conPostPatternDetail.createQueryBuilder();
  }
}
