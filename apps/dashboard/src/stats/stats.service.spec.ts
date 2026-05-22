import { DataSource } from 'typeorm';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  let ds: DataSource;
  let service: StatsService;

  beforeEach(async () => {
    ds = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await ds.initialize();
    service = new StatsService(
      ds.getRepository(Anime),
      ds.getRepository(Episode),
      ds.getRepository(Mirror),
      ds.getRepository(DownloadLink),
      ds.getRepository(Genre),
    );
  });

  afterEach(() => ds.destroy());

  it('reports counts and coverage gaps', async () => {
    await ds.getRepository(Anime).save([
      { source: 's', url: 'https://a/1', slug: 'a1', title: 'A1', score: '8.0', studio: 'X' } as Anime,
      { source: 's', url: 'https://a/2', slug: 'a2', title: 'A2', score: '', studio: undefined } as Anime,
    ]);
    await ds.getRepository(Episode).save({ source: 's', url: 'https://e/1' } as Episode);
    await ds.getRepository(Mirror).save([
      { episodeUrl: 'https://e/1', quality: '720p', host: 'mega', streamUrl: 'https://s/1' } as Mirror,
      { episodeUrl: 'https://e/1', quality: '480p', host: 'gdrive' } as Mirror,
    ]);

    const s = await service.summary();
    expect(s.counts.anime).toBe(2);
    expect(s.counts.episode).toBe(1);
    expect(s.counts.mirror).toBe(2);
    expect(s.gaps.animeMissingScore).toBe(1);
    expect(s.gaps.animeMissingStudio).toBe(1);
    expect(s.gaps.mirrorsUnresolved).toBe(1);
  });
});
