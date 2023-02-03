import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from '@libs/commons/entities/media.entity';
import { Like, Repository } from 'typeorm';
import { CreateMediaDto } from '@libs/commons/dto/create/create-media.dto';
import { UpdateMediaDto } from '@libs/commons/dto/update/update-media.dto';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly conMedia: Repository<Media>,
  ) {}

  async create(createMediaDto: CreateMediaDto) {
    try {
      let media = await this.findByUrl(createMediaDto.url);

      if (!media) {
        media = this.conMedia.create(createMediaDto);
        return this.conMedia.insert(media);
      }

      Object.assign(media, createMediaDto);
      return this.conMedia.update({ id: media.id }, media);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    try {
      return this.conMedia.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrl(urlMedia: string) {
    try {
      return this.conMedia.findOne({ where: { url: urlMedia } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrlLike(urlMedia: string) {
    try {
      return this.conMedia.findOne({ where: { url: Like(`%${urlMedia}%`) } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      return this.conMedia.findOne({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(urlMedia: string, updateMediaDto: UpdateMediaDto) {
    try {
      const media = await this.findByUrl(urlMedia);

      if (!media) throw new NotFoundException('data not found');
      Object.assign(media, updateMediaDto);

      return this.conMedia.update({ url: urlMedia }, media);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: number) {
    try {
      const media = await this.findOne(id);

      if (!media) throw new NotFoundException('data not found');

      return this.conMedia.remove(media);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
