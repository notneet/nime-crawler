import { CreatePostDetailPatternDto } from '@libs/commons/dto/create/create-post-detail-pattern.dto';
import { PatternPostDetailDto } from '@libs/commons/dto/post-pattern-detail.dto';
import { UpdatePostDetailPatternDto } from '@libs/commons/dto/update/update-post-detail-patter.dto';
import { PostDetailPattern } from '@libs/commons/entities/post-detail-pattern.entity';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { EntityManager, In, Repository } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class PostPatternDetailService {
  private readonly postPatternDetailTableName = 'post_detail_pattern';

  constructor(
    @InjectRepository(PostDetailPattern)
    private readonly conPostPatternDetail: Repository<PostDetailPattern>,
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async create(createPostPatternDetailDto: CreatePostDetailPatternDto) {
    try {
      let postDetail = await this.findByMediaId(
        createPostPatternDetailDto.media_id,
      );

      if (!postDetail) {
        postDetail = this.conPostPatternDetail.create(
          createPostPatternDetailDto,
        );
        return this.conPostPatternDetail.insert(postDetail);
      }
      Object.assign(postDetail, createPostPatternDetailDto);

      return this.conPostPatternDetail.update(
        { id: postDetail.id },
        postDetail,
      );
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<PatternPostDetailDto[]>> {
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
            .addSelect('COUNT(q.id)', 'postPatternDetailCount')
            .getRawOne()
        ).postPatternDetailCount || 0;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data: plainToInstance(PatternPostDetailDto, data),
        meta: pageMetaDto,
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      return this.conPostPatternDetail.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByMediaId(id: number) {
    try {
      return this.conPostPatternDetail.findOne({ where: { media_id: id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByMediaIds(id: number[]) {
    try {
      return this.conPostPatternDetail.find({ where: { media_id: In(id) } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async validate(id: number, nStatus: number) {
    try {
      const postDetail = await this.findOne(id);

      if (!postDetail) throw new NotFoundException('data not found');
      postDetail.n_status = nStatus;

      return this.conPostPatternDetail.save(postDetail);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(
    id: number,
    updatePostPatternDetailDto: UpdatePostDetailPatternDto,
  ) {
    try {
      const postDetail = await this.findOne(id);

      if (!postDetail) throw new NotFoundException('data not found');
      Object.assign(postDetail, updatePostPatternDetailDto);

      return this.conPostPatternDetail.update({ id }, postDetail);
    } catch (error) {
      throw new InternalServerErrorException(error);
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
      throw new InternalServerErrorException(error);
    }
  }

  private get baseQuery() {
    return this.eManager
      .createQueryBuilder()
      .from(this.postPatternDetailTableName, 'q');
  }

  private get postPatternEtityMetadata() {
    return this.eManager.connection.getRepository(PostDetailPattern);
  }
}
