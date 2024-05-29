import { CreateStreamDto } from '@libs/commons/dto/create/create-stream.dto';
import { StreamDto } from '@libs/commons/dto/stream.dto';
import { UpdateStreamDto } from '@libs/commons/dto/update/update-stream.dto';
import { Media } from '@libs/commons/entities/media.entity';
import { Stream } from '@libs/commons/entities/stream.entity';
import { Otakudesu } from '@libs/commons/helper/constant';
import { OtakudesuHelper } from '@libs/commons/helper/otakudesu';
import { ObscloudhostService } from '@libs/commons/obscloudhost/obscloudhost.service';
import { StringHelperService } from '@libs/commons/string-helper/string-helper.service';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { arrayNotEmpty, isEmpty } from 'class-validator';
import { Response } from 'express';
import { lastValueFrom, map } from 'rxjs';
import { EntityManager } from 'typeorm';
import { PageDto, PageMetaDto, PageOptionsDto } from '../dtos/pagination.dto';

@Injectable()
export class StreamService {
  constructor(
    @InjectEntityManager() protected readonly eManager: EntityManager,
    private readonly httpService: HttpService,
    private readonly obsCloudhostService: ObscloudhostService,
    private readonly stringHelperService: StringHelperService,
  ) {}

  async saveToDB(
    createStreamDto: CreateStreamDto,
    mediaId: number,
    oldOrigin?: string | null | undefined,
  ) {
    try {
      const tableName = `stream_${mediaId}`;
      let stream = await this.findByObjectIdWithMediaId(
        [
          String(
            this.stringHelperService.makeOldObjectId(
              oldOrigin,
              createStreamDto?.url,
            ),
          ),
          String(createStreamDto?.object_id),
        ],
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
      stream.updated_at = new Date();

      return this.streamEtityMetadata
        .createQueryBuilder()
        .update(tableName)
        .set(stream)
        .where({ id: stream.id })
        .execute();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findAll(
    mediaId: string,
    pageOptDto: PageOptionsDto,
  ): Promise<PageDto<StreamDto[]>> {
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
        data: plainToInstance(StreamDto, data),
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

  async findByObjectId(
    mediaId: string,
    objectId: string,
  ): Promise<PageDto<StreamDto>> {
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

    return {
      data: plainToInstance(StreamDto, stream),
    };
  }

  async findByWatchId(watchId: string, mediaId: string): Promise<Stream[]> {
    const tableName = `stream_${mediaId}`;
    let stream: Stream[] | undefined;

    try {
      stream = await this.baseQuery(tableName)
        .where({
          watch_id: watchId,
        } as Partial<Stream>)
        .getRawMany();
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

  async extractEpisode(
    mediaId: string,
    hash: string,
  ): Promise<{ url: string }> {
    const media = await this.baseQuery(`media`)
      .where({ id: mediaId })
      .getRawOne<Media>();

    if (isEmpty(media))
      throw new UnprocessableEntityException('media not found');

    const body = JSON.parse(atob(hash));
    body.nonce = '9269ac80b2';
    body.action = '2a3505c93b0035d3f455df82bf976b84';

    const res = await lastValueFrom(
      this.httpService
        .post(
          `https://${media?.url}${Otakudesu.endpointEpisodeExtractor}`,
          body,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        )
        .pipe(map((data) => data)),
    );
    const helper = new OtakudesuHelper();

    return { url: await helper.extractUrlStream(atob(res.data.data)) };
  }

  async getSubs(urlSub: string, res: Response) {
    const obj = await this.obsCloudhostService.getFile(urlSub);

    obj?.on('data', (chunk) => {
      res.write(chunk);
    });

    obj?.on('end', () => {
      res.end();
    });

    return obj;
  }

  /**
   *
   */

  groupEpisodesByQuality(rawList: Stream[]) {
    if (!arrayNotEmpty(rawList)) return rawList || [];
    return rawList?.reduce((acc, video) => {
      const { quality } = video;

      if (!acc[quality]) {
        acc[quality] = [];
      }
      acc[quality].push(video);

      return acc;
    }, {});
  }

  private async findByUrlWithMediaId(
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

  private async findByObjectIdWithMediaId(
    objectId: string[],
    mediaId: number,
  ): Promise<Stream | undefined> {
    const tableName = `stream_${mediaId}`;

    try {
      return this.baseQuery(tableName)
        .where({ object_id: objectId[0] } as Partial<Stream>)
        .orWhere({ object_id: objectId[1] } as Partial<Stream>)
        .getRawOne();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  private baseQuery(tableName: string) {
    return this.eManager.createQueryBuilder().from(tableName, 'q');
  }

  private get streamEtityMetadata() {
    return this.eManager.connection.getRepository(Stream);
  }

  private get mediaEntityMetadata() {
    return this.eManager.connection.getRepository(Media);
  }
}
