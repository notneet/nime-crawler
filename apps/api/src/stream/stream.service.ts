import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { Stream } from '@libs/commons/entities/stream.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import 'moment-timezone';
import { EntityManager } from 'typeorm';

@Injectable()
export class StreamService {
  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
  ) {}

  async saveToDB(createStreamDto: CreateStreamDto, mediaId: number) {
    try {
      const tableName = `stream_${mediaId}`;
      let stream = await this.findByUrlWithMediaId(
        createStreamDto.url,
        mediaId,
      );

      if (!stream) {
        stream = this.streamEtityMetadata.create(createStreamDto);
        return this.streamEtityMetadata
          .createQueryBuilder()
          .insert()
          .into(tableName)
          .values(stream)
          .execute();
      }
      Object.assign(stream, createStreamDto);
      delete stream.updated_at;

      return this.streamEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(stream)
        .where({ id: stream.id })
        .execute();
    } catch (error) {}
  }

  async findAll(mediaId: string) {
    const tableName = `stream_${mediaId}`;
    try {
      return this.baseQuery(tableName).getRawMany();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrlWithMediaId(
    urlStream: string,
    mediaId: number,
  ): Promise<Stream> {
    try {
      const tableName = `stream_${mediaId}`;

      return this.baseQuery(tableName)
        .where({ url: urlStream } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUrl(mediaId: string, urlStream: string) {
    const tableName = `stream_${mediaId}`;

    try {
      return this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ url: urlStream } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(mediaId: string, id: number) {
    let stream: Stream;
    const tableName = `stream_${mediaId}`;

    try {
      stream = await this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ id } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!stream) throw new NotFoundException('data not found');

    return stream;
  }

  async findByObjectId(mediaId: string, objectId: string) {
    const tableName = `stream_${mediaId}`;
    let stream: Stream;

    try {
      stream = await this.baseQuery(tableName)
        .where({
          object_id: objectId,
        } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }

    if (!stream) {
      throw new NotFoundException('data not found');
    }

    return stream;
  }

  async create(createStreamDto: CreateStreamDto, mediaId?: string) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  async update(
    mediaId: string,
    objectId: string,
    updateStreamDto: UpdateStreamDto,
  ) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  async remove(mediaId: string, objectId: string) {
    throw new BadRequestException(`Mechanism is not provided`);
  }

  private baseQuery(tableName: string) {
    return this.eManager.createQueryBuilder().from(tableName, 'q');
  }

  private get streamEtityMetadata() {
    return this.eManager.connection.getRepository(Stream);
  }
}
