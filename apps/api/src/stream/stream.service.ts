import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { Stream } from '@libs/commons/entities/stream.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import 'moment-timezone';
import { Repository } from 'typeorm';
import { WatchService } from '../watch/watch.service';

@Injectable()
export class StreamService {
  constructor(
    @InjectRepository(Stream)
    private readonly conStream: Repository<Stream>,
    private readonly watchService: WatchService,
  ) {}

  async create(createStreamDto: CreateStreamDto) {
    try {
      // let watch = await this.watchService.findByObjectId(
      //   createStreamDto.watch_id,
      // );
      //
      // if (!watch) return new NotFoundException('parent post not found');
      // let stream = await this.findByUrl(createStreamDto.url);
      //
      // if (!stream) {
      //   stream = this.conStream.create(createStreamDto);
      //   return this.conStream.insert(stream);
      // }
      // Object.assign(stream, createStreamDto);
      //
      // return this.conStream.update({ id: stream.id }, stream);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll() {
    try {
      return this.conStream.find();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrl(urlStream: string) {
    try {
      return this.conStream.findOne({
        where: { url: urlStream },
      });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: number) {
    try {
      const stream = await this.conStream.findOne({ where: { id } });
      if (!stream) throw new NotFoundException('data not found');

      return stream;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByObjectId(id: string) {
    try {
      const stream = await this.conStream.findOne({ where: { object_id: id } });
      if (!stream) throw new NotFoundException('data not found');

      return stream;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: string, updateStreamDto: UpdateStreamDto) {
    try {
      const stream = await this.findByObjectId(id);
      Object.assign(stream, updateStreamDto);

      return this.conStream.update({ watch_id: id }, stream);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: string) {
    try {
      const stream = await this.findByObjectId(id);

      return this.conStream.remove(stream);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
