import { CreatePostPatternDto } from '@libs/commons/dto/create/create-post-pattern.dto';
import { PostPattern } from '@libs/commons/entities/post-pattern.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PostPatternService {
  constructor(
    @InjectRepository(PostPattern)
    private readonly conPostPattern: Repository<PostPattern>,
  ) {}

  async create(createPostPatternDto: CreatePostPatternDto) {
    try {
      let postPattern = await this.findByMediaId(createPostPatternDto.media_id);

      if (!postPattern) {
        postPattern = this.conPostPattern.create(createPostPatternDto);
        return this.conPostPattern.insert(postPattern);
      }

      Object.assign(postPattern, createPostPatternDto);
      return this.conPostPattern.update({ id: postPattern.id }, postPattern);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    try {
      return this.conPostPattern.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      return this.conPostPattern.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByMediaId(id: number) {
    try {
      return this.conPostPattern.findOne({ where: { media_id: id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async validate(id: number, nStatus: number) {
    try {
      const isAvailable = await this.findOne(id);

      if (!isAvailable) throw new NotFoundException('data not found');
      isAvailable.n_status = nStatus;

      return this.conPostPattern.save(isAvailable);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: number, updatePostPatternDto: Partial<PostPattern>) {
    try {
      const postPattern = await this.findOne(id);

      if (!postPattern) throw new NotFoundException('data not found');
      Object.assign(postPattern, updatePostPatternDto);

      return this.conPostPattern.update({ id }, postPattern);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const postPattern = await this.findOne(id);

      if (!postPattern) throw new NotFoundException('data not found');

      return this.conPostPattern.remove(postPattern);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
