import { AnimeEpisodeModelService } from '@data-access/anime-episode-model/anime-episode-model.service';
import { AnimeEpisodeModel } from '@entities/anime_episode_model.entity';
import { AnimeEpisodeResultData } from '@entities/types/anime-episode.interface';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';

@Injectable()
export class ReadEpisodeService {
  private readonly logger = new Logger(ReadEpisodeService.name);

  constructor(
    private readonly animeEpisodeModelService: AnimeEpisodeModelService,
  ) {}

  async updateEpisode(
    data: AnimeEpisodeResultData,
    mediaId: bigint,
    animeId: bigint,
  ) {
    const [isExists, animeEpisode] = await this.findAnimeEpisode(
      mediaId,
      animeId,
    );

    if (!isExists) {
      return;
    }

    const payload: Partial<AnimeEpisodeModel> = {
      ...animeEpisode,
      video_url: data.embed_url,
    };

    return this.animeEpisodeModelService.storeData(payload, mediaId);
  }

  private async findAnimeEpisode(
    mediaId: bigint,
    animeId: bigint,
  ): Promise<[boolean, AnimeEpisodeModel | null]> {
    const animeEpisode = await this.animeEpisodeModelService.findByAnimeId(
      animeId,
      mediaId,
    );

    if (isEmpty(animeEpisode)) {
      this.logger.warn(`Anime episode with anime.id #${animeId} not found`);
      return [false, null];
    }

    return [true, animeEpisode];
  }

  async wait(sec: number) {
    this.logger.warn(`Wait ${sec} seconds...`);
    await new Promise((resolve) => setTimeout(resolve, sec * 1000));
  }

  getHello(): string {
    return 'Hello World!';
  }
}
