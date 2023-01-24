import { CreatePostDetailPatternDto } from '@libs/commons/dto/create/create-post-detail-pattern.dto';
import { UpdatePostDetailPatternDto } from '@libs/commons/dto/update/update-post-detail-patter.dto';
import { PostDetailPattern } from '@libs/commons/entities/post-detail-pattern.entity';
import { EnvKey } from '@libs/commons/helper/constant';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';

@Injectable()
export class PostPatternDetailService {
  private readonly postPatternDetailTableName = 'post_detail_pattern';

  constructor(
    @InjectRepository(PostDetailPattern)
    private readonly conPostPatternDetail: Repository<PostDetailPattern>,
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

  async findAll() {
    try {
      return this.conPostPatternDetail.find();
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
    return this.conPostPatternDetail.createQueryBuilder();
  }
}
