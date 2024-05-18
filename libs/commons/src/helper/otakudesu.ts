import { HttpService } from '@nestjs/axios';
import { load } from 'cheerio';
import * as libxmljs from 'libxmljs2';
import { lastValueFrom, map } from 'rxjs';
import { AnimeEpisode } from '../html-scraper/html-scraper.service';
import { hashUUID } from './md5';

interface IHashEpisodeOtakudesu {
  id: number;
  i: number;
  q: string;
}

export class OtakudesuHelper {
  mappingStreamProviderByQuality(
    data: AnimeEpisode,
  ): [AnimeEpisode[], AnimeEpisode[], AnimeEpisode[]] {
    let provider360: AnimeEpisode[] = [];
    let provider480: AnimeEpisode[] = [];
    let provider720: AnimeEpisode[] = [];

    Array.from(data?.EPISODE_HASH)?.map((hash: string, i) => {
      const decodedHash: IHashEpisodeOtakudesu = JSON.parse(atob(hash));

      switch (true) {
        case decodedHash?.q?.includes('360'):
          provider360.push({
            object_id: hashUUID(
              `${data.object_id}-${data.EPISODE_PROVIDER[i]}-360`,
            ),
            EPISODE_PROVIDER: data.EPISODE_PROVIDER[i],
            EPISODE_HASH: hash,
          });
          break;
        case decodedHash?.q?.includes('480'):
          provider480.push({
            object_id: hashUUID(
              `${data.object_id}-${data.EPISODE_PROVIDER[i]}-480`,
            ),
            EPISODE_PROVIDER: data.EPISODE_PROVIDER[i],
            EPISODE_HASH: hash,
          });
          break;
        case decodedHash?.q?.includes('720'):
          provider720.push({
            object_id: hashUUID(
              `${data.object_id}-${data.EPISODE_PROVIDER[i]}-720`,
            ),
            EPISODE_PROVIDER: data.EPISODE_PROVIDER[i],
            EPISODE_HASH: hash,
          });
      }
    });

    return [provider360, provider480, provider720];
  }

  async extractUrlStream(src: string) {
    let document: libxmljs.Document;
    let url: string = '';
    try {
      document = libxmljs.parseHtmlString(src);
      url = (<any>document.get('//iframe/@src'))?.value();
    } catch (error) {
      throw error;
    }
    const httpService = new HttpService();
    const html = await lastValueFrom(
      httpService.get(url).pipe(map((data) => data.data)),
    );

    try {
      const $ = load(html);
      const videoSource = $('script[type="text/javascript"]').first().html()!;
      const match = /'file':'([^']+)'/gm.exec(videoSource);
      const videoFileUrl = match && match[1];

      if (!videoFileUrl) {
        throw new Error('Video file URL not found in the HTML content.');
      }

      return videoFileUrl;
    } catch (error) {
      throw error;
    }
  }
}
