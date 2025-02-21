import { AnimeModelService } from '@data-access/anime-model/anime-model.service';
import { AnimeModel } from '@entities/anime_model.entity';
import { AnimeLinkResultData } from '@entities/types/anime-link.interface';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { createHash } from 'crypto';

@Injectable()
export class ReadLinkService {
  private readonly logger = new Logger(ReadLinkService.name);

  constructor(private readonly animeModelService: AnimeModelService) {}

  // async saveEpisode(
  //   pageUrl: string,
  //   datas: AnimeLinkResultData[],
  //   mediaId: bigint,
  //   animeId: bigint,
  // ) {
  //   const [isExists, anime] = await this.findAnime(mediaId, animeId);

  //   if (!isExists) {
  //     return;
  //   }

  //   const payload: Partial<AnimeEpisodeModel> = {
  //     anime_id: anime.id,
  //     uuid: this.makeUUID(pageUrl),
  //     url: pageUrl,
  //     video_url: Array(10)
  //       .fill('')
  //       .map(() =>
  //         String.fromCharCode(Math.floor(Math.random() * (122 - 97 + 1)) + 97),
  //       )
  //       .join(''),
  //     download_list: datas,
  //     mirrors: [],
  //   };

  //   return this.animeEpisodeModelService.storeData(payload, mediaId);
  // }

  async updateAnime(
    datas: AnimeLinkResultData[],
    mediaId: bigint,
    animeId: bigint,
  ) {
    const [isExists, anime] = await this.findAnime(mediaId, animeId);

    if (!isExists) {
      return;
    }

    const payload: Partial<AnimeModel> = {
      ...anime,
      batch_download_list: datas,
    };

    return this.animeModelService.storeData(payload, mediaId);
  }

  async wait(sec: number) {
    this.logger.warn(`Wait ${sec} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  private async findAnime(
    mediaId: bigint,
    animeId: bigint,
  ): Promise<[boolean, AnimeModel | null]> {
    const anime = await this.animeModelService.findById(animeId, mediaId);

    if (isEmpty(anime)) {
      this.logger.warn(`Anime with id #${animeId} not found`);
      return [false, null];
    }

    return [true, anime];
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
