import { DataSource, Repository } from 'typeorm';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { EpisodeService } from './episode.service';

describe('EpisodeService', () => {
  let ds: DataSource;
  let service: EpisodeService;

  beforeEach(async () => {
    ds = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await ds.initialize();
    service = new EpisodeService(
      ds.getRepository(Episode),
      ds.getRepository(Mirror),
      ds.getRepository(DownloadLink),
    );
  });

  afterEach(() => ds.destroy());

  const seedEpisode = (): Promise<Episode> =>
    (ds.getRepository(Episode) as Repository<Episode>).save({
      source: 'otakudesu',
      url: 'https://otakudesu.blog/episode/foo-11/',
      animeUrl: 'https://otakudesu.blog/anime/foo/',
      title: 'Episode 11',
    } as Episode);

  it('detail returns episode, its mirrors and downloads', async () => {
    const e = await seedEpisode();
    await ds.getRepository(Mirror).save({ episodeUrl: e.url, quality: '720p', host: 'mega' } as Mirror);
    await ds
      .getRepository(DownloadLink)
      .save({ source: 'otakudesu', ownerUrl: e.url, kind: 'episode', url: 'https://dl/1' } as DownloadLink);
    const d = await service.detail(e.id);
    expect(d?.episode.id).toBe(e.id);
    expect(d?.mirrors).toHaveLength(1);
    expect(d?.downloads).toHaveLength(1);
  });

  it('detail returns null for missing id', async () => {
    expect(await service.detail(999)).toBeNull();
  });

  it('update patches fields and returns the row', async () => {
    const e = await seedEpisode();
    const updated = await service.update(e.id, { title: 'Renamed' });
    expect(updated?.title).toBe('Renamed');
  });

  it('delete removes the episode and its mirrors; returns true', async () => {
    const e = await seedEpisode();
    await ds.getRepository(Mirror).save({ episodeUrl: e.url, quality: '720p', host: 'mega' } as Mirror);
    const ok = await service.remove(e.id);
    expect(ok).toBe(true);
    expect(await ds.getRepository(Episode).findOneBy({ id: e.id })).toBeNull();
    expect(await ds.getRepository(Mirror).findOneBy({ episodeUrl: e.url })).toBeNull();
  });

  it('delete returns false for missing id', async () => {
    expect(await service.remove(999)).toBe(false);
  });
});
