import { AnimeModelService } from '@data-access/anime-model/anime-model.service';
import { AnimeModel } from '@entities/anime_model.entity';
import { PayloadMessage } from '@entities/types/payload-anime-index.type';
import { AnimeDetailResultData } from '@entities/types/read-detail.interface';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty, isNotEmpty } from 'class-validator';
import { createHash } from 'crypto';
import { DateTime } from 'luxon';

@Injectable()
export class ReadDetailService {
  private readonly logger = new Logger(ReadDetailService.name);

  constructor(private readonly animeModelService: AnimeModelService) {}

  constructPayloadAnimeDownload(
    data: PayloadMessage,
    pageUrl: string,
    pageNum: number,
    animeId: string,
  ): PayloadMessage {
    return {
      dataId: animeId,
      media_id: data?.media_id,
      media_url: data?.media_url,
      page_url: pageUrl,
      page_num: pageNum,
      pattern_index: null,
      pattern_detail: null,
      pattern_watch: data?.pattern_watch || null,
      pattern_link: data?.pattern_link || null,
    } satisfies PayloadMessage;
  }

  async save(data: AnimeDetailResultData, mediaId: bigint, url: string) {
    const payload: Partial<AnimeModel> = {
      uuid: this.makeUUID(url),
      url,
      title_en: data?.title,
      title_jp: '',
      description: data?.description,
      image_url: data?.image_url,
      producers: '',
      studios: '',
      genres: '',
      episode_count: !isNaN(Number(data?.episode_count))
        ? Number(data?.episode_count)
        : 0,
      episode_duration: 0,
      rating: !isNaN(parseFloat(data?.score)) ? parseFloat(data?.score) : 0,
      release_date:
        isNotEmpty(data?.datetime) &&
        !isNaN(DateTime.fromJSDate(data?.datetime).toMillis())
          ? DateTime.fromJSDate(data?.datetime).toMillis() >= 0
            ? new Date(data?.datetime)
            : new Date()
          : new Date(),
    };

    return this.animeModelService.storeData(payload, mediaId);
  }

  async wait(sec: number) {
    this.logger.warn(`Wait ${sec} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  private makeUUID(url: string) {
    if (isEmpty(url)) throw new Error('URL is empty');

    const urlWithoutProtocol = url.replace(/https?:\/\//, '');

    return createHash('md5').update(urlWithoutProtocol).digest('hex');
  }

  getHello(): string {
    return 'Hello World!';
  }
}
