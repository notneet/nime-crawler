import { AnimeEpisode } from '../html-scraper/html-scraper.service';
import { hashUUID } from './md5';

interface IHashEpisodeOtakudesu {
  id: number;
  i: number;
  q: string;
}

export const mappingStreamProviderByQuality = (
  data: AnimeEpisode,
): [AnimeEpisode[], AnimeEpisode[], AnimeEpisode[]] => {
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
};
