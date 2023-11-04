import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { Stream } from '@libs/commons/entities/stream.entity';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import 'moment-timezone';
import { EntityManager } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

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

  async findAll(
    mediaId: string,
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<Stream>> {
    const tableName = `stream_${mediaId}`;

    try {
      const data = await this.baseQuery(tableName)
        .orderBy('q.updated_at', pageOptDto?.order)
        .skip(pageOptDto?.skip)
        .take(pageOptDto?.take)
        .getRawMany();
      const itemCount = +(
        await this.baseQuery(tableName)
          .orderBy('q.updated_at', pageOptDto?.order)
          .addSelect('COUNT(q.id)', 'streamsCount')
          .getRawOne()
      ).streamsCount;

      const pageMetaDto = new PageMetaDto({
        itemCount,
        pageOptionsDto: pageOptDto,
      });

      return {
        data,
        meta: pageMetaDto,
      };
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findByUrlWithMediaId(
    urlStream: string,
    mediaId: number,
  ): Promise<Stream | undefined> {
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
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }
  }

  async findOne(mediaId: string, id: number) {
    let stream: Stream | undefined;
    const tableName = `stream_${mediaId}`;

    try {
      stream = await this.baseQuery(tableName)
        .createQueryBuilder()
        .where({ id } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }

    if (!stream) throw new NotFoundException('data not found');

    return stream;
  }

  async findByObjectId(mediaId: string, objectId: string) {
    const tableName = `stream_${mediaId}`;
    let stream: Stream | undefined;

    try {
      stream = await this.baseQuery(tableName)
        .where({
          object_id: objectId,
        } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      switch (error.code) {
        case 'ER_NO_SUCH_TABLE':
          throw new UnprocessableEntityException(
            `media_id: ${mediaId} not found`,
          );
        default:
          throw new InternalServerErrorException(error);
      }
    }

    if (!stream) {
      throw new NotFoundException('data not found');
    }

    return stream;
  }

  async create(createStreamDto: CreateStreamDto, mediaId?: string) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  async update(
    mediaId: string,
    objectId: string,
    updateStreamDto: UpdateStreamDto,
  ) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  async remove(mediaId: string, objectId: string) {
    throw new NotImplementedException(`Mechanism is not provided`);
  }

  /**
   *
   */

  private baseQuery(tableName: string) {
    return this.eManager.createQueryBuilder().from(tableName, 'q');
  }

  private get streamEtityMetadata() {
    return this.eManager.connection.getRepository(Stream);
  }
}
