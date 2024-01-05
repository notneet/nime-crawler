import { CreatePostPatternDto } from '@libs/commons/dto/create/create-post-pattern.dto';
import { PostPatternDto } from '@libs/commons/dto/post-pattern.dto';
import { PostPattern } from '@libs/commons/entities/post-pattern.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, In } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class PostPatternService {
  private readonly postPatternTableName = 'post_pattern';

  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async create(createPostPatternDto: CreatePostPatternDto) {
    const tableName = `post_pattern`;

    try {
      let postPattern = await this.findByMediaId(createPostPatternDto.media_id);

      if (!postPattern) {
        postPattern =
          this.postPatternEtityMetadata.create(createPostPatternDto);
        return this.postPatternEtityMetadata
          .createQueryBuilder()
          .insert()
          .into(tableName)
          .values(postPattern)
          .execute();
      }

      Object.assign(postPattern, createPostPatternDto);
      return this.postPatternEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(postPattern)
        .where({ id: postPattern.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<PostPatternDto[]>> {
    try {
      const data = await this.baseQuery
        .orderBy('q.updated_at', pageOptDto?.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getRawMany();
      const itemCount =
        +(
          await this.baseQuery
            .orderBy('q.updated_at', pageOptDto?.order)
            .addSelect('COUNT(q.id)', 'postPatternCount')
            .getRawOne()
        ).postPatternCount || 0;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(PostPatternDto, data),
        meta: pageMetaDto,
      };
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `table ${this.postPatternTableName} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findOne(id: number): Promise<PageDto<PostPatternDto>> {
    let postPattern: PostPattern | undefined;

    try {
      postPattern = await this.baseQuery
        .where({ id } as Partial<PostPattern>)
        .getRawOne();

      return {
        data: plainToInstance(PostPatternDto, postPattern),
      };
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `table ${this.postPatternTableName} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findByMediaId(id: number) {
    try {
      return this.postPatternEtityMetadata
        .createQueryBuilder()
        .where({ media_id: id })
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByMediaIds(id: number[]): Promise<PostPattern[]> {
    try {
      return this.postPatternEtityMetadata.find({
        where: { media_id: In(id) },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async validate(id: number, nStatus: number) {
    const tableName = `post_pattern`;
    let postPattern: PostPattern | undefined;

    try {
      const isAvailable = await this.findOne(id);

      if (!isAvailable?.data) throw new NotFoundException('data not found');
      postPattern = isAvailable.data as PostPattern;
      postPattern.n_status = nStatus;

      return this.postPatternEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(postPattern)
        .where({ id: postPattern.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updatePostPatternDto: Partial<PostPattern>) {
    let postPattern: PostPattern | undefined;

    try {
      const isAvailable = await this.findOne(id);

      if (!isAvailable?.data) throw new NotFoundException('data not found');
      postPattern = isAvailable?.data as PostPattern;
      Object.assign(postPattern, updatePostPatternDto);

      return this.postPatternEtityMetadata
        .createQueryBuilder()
        .update()
        .set(postPattern)
        .where({ id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const isAvailable = await this.findOne(id);

      if (!isAvailable?.data) throw new NotFoundException('data not found');

      return this.postPatternEtityMetadata
        .createQueryBuilder()
        .delete()
        .where({ id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  /**
   *
   */

  private get baseQuery() {
    return this.eManager
      .createQueryBuilder()
      .from(this.postPatternTableName, 'q');
  }

  private get postPatternEtityMetadata() {
    return this.eManager.connection.getRepository(PostPattern);
  }
}
