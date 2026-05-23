import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ParsedResultDto } from '@libs/commons/messaging/parsed-result.dto';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { ResultMapper } from './result.mapper';
import { ResultStoreService } from './result-store.service';

const cfgStub = (autoArchive: boolean): ConfigService =>
  ({
    get: (_key: string, def?: string) => (autoArchive ? 'true' : def),
  }) as unknown as ConfigService;

describe('ResultStoreService', () => {
  let dataSource: DataSource;
  let service: ResultStoreService;
  let amqp: { publish: jest.Mock };

  const buildService = (autoArchive: boolean): ResultStoreService =>
    new ResultStoreService(
      dataSource,
      new ResultMapper(),
      amqp as unknown as AmqpConnection,
      cfgStub(autoArchive),
    );

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await dataSource.initialize();
    amqp = { publish: jest.fn() };
    service = buildService(true);
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

  it('episode with downloads: publishes a download job once with episodeId/source', async () => {
    await service.handle(episodeResult());

    const ep = await dataSource.getRepository(Episode).findOneBy({
      source: 'otakudesu',
      url: 'https://otakudesu.blog/episode/foo-episode-11/',
    });
    expect(ep).not.toBeNull();

    expect(amqp.publish).toHaveBeenCalledTimes(1);
    expect(amqp.publish).toHaveBeenCalledWith('anime.download', 'download.episode.otakudesu', {
      episodeId: ep!.id,
      source: 'otakudesu',
    });
  });

  it('episode without downloads: does not publish a download job', async () => {
    const result: ParsedResultDto = {
      source: 'otakudesu',
      stage: 'episode',
      url: 'https://otakudesu.blog/episode/foo-episode-12/',
      data: { title: 'Episode 12' },
    };
    await service.handle(result);

    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('non-episode result: does not publish a download job', async () => {
    await service.handle(detailResult());

    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('auto-trigger disabled: episode with downloads does not publish', async () => {
    service = buildService(false);
    await service.handle(episodeResult());

    expect(amqp.publish).not.toHaveBeenCalled();
  });
});
