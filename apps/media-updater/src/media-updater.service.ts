import { AnimeSourceDto } from '@libs/commons/dto/anime-souce.dto';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AnimeSourceService } from 'apps/api/src/anime-source/anime-source.service';
import { MediaService } from 'apps/api/src/media/media.service';

@Injectable()
export class MediaUpdaterService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MediaUpdaterService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly animeSourceService: AnimeSourceService,
  ) {}

  async onApplicationBootstrap() {
    return this.createNewAnimeSourceOrigin();
  }

  /**
   * - Get media where old media not null (done)
   * - get anime source by media id (done)
   * - if origin media url not same, replace with a new one (done)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async createNewAnimeSourceOrigin(): Promise<boolean> {
    let updatedAnimeSource: AnimeSourceDto[] = [];
    const medias = await this.mediaService.findMediaWithOldUrl();

    for (const media of medias?.data) {
      const animeSourcesByMediaId = await this.animeSourceService.findByMediaId(
        media?.id,
      );

      for (const animeSource of animeSourcesByMediaId?.data) {
        const extractedUrl = new URL(animeSource?.url);

        if (media?.url !== extractedUrl?.host) {
          const pathUrl = extractedUrl?.pathname;
          const protocol = extractedUrl?.protocol;

          const newPayload: AnimeSourceDto = {
            ...animeSource,
            url: `${protocol}//${media?.url}${pathUrl}`,
          };
          await this.animeSourceService.update(animeSource?.id, newPayload);

          updatedAnimeSource.push(newPayload);
        }
      }
    }
    this.logger.log(
      `Updated ${updatedAnimeSource?.length} anime source with new media url`,
    );

    return true;
  }
}
