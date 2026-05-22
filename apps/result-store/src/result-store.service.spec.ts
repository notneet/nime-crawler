import { DataSource } from 'typeorm';
import { ParsedResultDto } from '@libs/commons/messaging/parsed-result.dto';
import { Anime } from './entities/anime.entity';
import { Genre } from './entities/genre.entity';
import { AnimeGenre } from './entities/anime-genre.entity';
import { Episode } from './entities/episode.entity';
import { Mirror } from './entities/mirror.entity';
import { DownloadLink } from './entities/download-link.entity';
import { ResultMapper } from './result.mapper';
import { ResultStoreService } from './result-store.service';

describe('ResultStoreService', () => {
  let dataSource: DataSource;
  let service: ResultStoreService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await dataSource.initialize();
    service = new ResultStoreService(dataSource, new ResultMapper());
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  const detailResult = (over: Partial<ParsedResultDto> = {}): ParsedResultDto => ({
    source: 'otakudesu',
    stage: 'detail',
    url: 'https://otakudesu.blog/anime/foo-anime/',
    data: {
      title: 'Foo Anime',
      titleJP: 'Foo JP',
      genres: ['Action', 'Comedy'],
      status: 'Ongoing',
    },
    ...over,
  });

  const episodeResult = (): ParsedResultDto => ({
    source: 'otakudesu',
    stage: 'episode',
    url: 'https://otakudesu.blog/episode/foo-episode-11/',
    data: {
      title: 'Episode 11',
      mirror360Host: ['GDrive', 'Mega'],
      mirror360Payload: ['payload1', 'payload2'],
      downloads: [{ links: ['https://dl.example.com/ep11.mp4'] }],
    },
  });

  const batchResult = (): ParsedResultDto => ({
    source: 'otakudesu',
    stage: 'batch',
    url: 'https://otakudesu.blog/batch/foo-batch/',
    data: {
      downloads: [
        {
          quality: '720p',
          size: '2GB',
          links: ['https://dl.example.com/batch1.zip', 'https://dl.example.com/batch2.zip'],
          hosts: ['GDrive', 'Mega'],
        },
      ],
    },
  });

  it('detail message: creates anime row, genre rows, and anime_genre join rows', async () => {
    await service.handle(detailResult());

    const animes = await dataSource.getRepository(Anime).find();
    expect(animes).toHaveLength(1);
    expect(animes[0]).toMatchObject({ title: 'Foo Anime', slug: 'foo-anime' });

    const genres = await dataSource.getRepository(Genre).find();
    expect(genres).toHaveLength(2);
    expect(genres.map((g) => g.slug).sort()).toEqual(['action', 'comedy']);

    const joins = await dataSource.getRepository(AnimeGenre).find();
    expect(joins).toHaveLength(2);
  });

  it('episode message: creates episode row, mirror rows, download_link rows', async () => {
    await service.handle(episodeResult());

    const episodes = await dataSource.getRepository(Episode).find();
    expect(episodes).toHaveLength(1);
    expect(episodes[0].number).toBe('11');

    const mirrors = await dataSource.getRepository(Mirror).find();
    expect(mirrors).toHaveLength(2);
    expect(mirrors.every((m) => m.quality === '360p')).toBe(true);

    const downloads = await dataSource.getRepository(DownloadLink).find();
    expect(downloads).toHaveLength(1);
    expect(downloads[0].kind).toBe('episode');
  });

  it('batch message: creates download_link rows with quality, size, host, kind=batch', async () => {
    await service.handle(batchResult());

    const downloads = await dataSource.getRepository(DownloadLink).find();
    expect(downloads).toHaveLength(2);
    expect(downloads.every((d) => d.kind === 'batch')).toBe(true);
    expect(downloads.every((d) => d.quality === '720p')).toBe(true);
    expect(downloads.every((d) => d.size === '2GB')).toBe(true);
    expect(downloads.map((d) => d.host).sort()).toEqual(['GDrive', 'Mega']);
  });

  it('sending same detail message twice results in 1 anime row (upsert dedupe)', async () => {
    await service.handle(detailResult());
    await service.handle(detailResult());

    const count = await dataSource.getRepository(Anime).count();
    expect(count).toBe(1);
  });

  it('re-sending an episode message does not duplicate its host-less download_link', async () => {
    await service.handle(episodeResult());
    await service.handle(episodeResult());

    const downloads = await dataSource.getRepository(DownloadLink).find();
    expect(downloads).toHaveLength(1);
  });

  it('re-sending a batch message does not duplicate download_link rows', async () => {
    await service.handle(batchResult());
    await service.handle(batchResult());

    const downloads = await dataSource.getRepository(DownloadLink).find();
    expect(downloads).toHaveLength(2);
  });
});
