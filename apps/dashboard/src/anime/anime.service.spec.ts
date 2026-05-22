import { DataSource, Repository } from 'typeorm';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink } from '@libs/commons/entities';
import { AnimeService } from './anime.service';

describe('AnimeService', () => {
  let ds: DataSource;
  let service: AnimeService;

  beforeEach(async () => {
    ds = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await ds.initialize();
    service = new AnimeService(
      ds.getRepository(Anime),
      ds.getRepository(AnimeGenre),
      ds.getRepository(Genre),
      ds.getRepository(Episode),
    );
  });

  afterEach(() => ds.destroy());

  const seedAnime = (over: Partial<Anime> = {}): Promise<Anime> =>
    (ds.getRepository(Anime) as Repository<Anime>).save({
      source: 'otakudesu',
      url: `https://otakudesu.blog/anime/foo-${Math.random()}/`,
      slug: 'foo',
      title: 'Foo Anime',
      ...over,
    } as Anime);

  it('lists with pagination and total', async () => {
    for (let i = 0; i < 3; i++) await seedAnime({ title: `T${i}` });
    const res = await service.list('', 1, 2);
    expect(res.total).toBe(3);
    expect(res.rows).toHaveLength(2);
    expect(res.page).toBe(1);
    expect(res.pageSize).toBe(2);
  });

  it('filters by title query (case-insensitive)', async () => {
    await seedAnime({ title: 'Naruto' });
    await seedAnime({ title: 'Bleach' });
    const res = await service.list('naru', 1, 20);
    expect(res.total).toBe(1);
    expect(res.rows[0].title).toBe('Naruto');
  });

  it('detail returns anime, its episodes and genres', async () => {
    const a = await seedAnime();
    await ds.getRepository(Episode).save({ source: 'otakudesu', url: 'https://e/1', animeUrl: a.url } as Episode);
    const g = await ds.getRepository(Genre).save({ name: 'Action', slug: 'action' } as Genre);
    await ds.getRepository(AnimeGenre).save({ animeId: a.id, genreId: g.id } as AnimeGenre);
    const d = await service.detail(a.id);
    expect(d?.anime.id).toBe(a.id);
    expect(d?.episodes).toHaveLength(1);
    expect(d?.genres.map((x) => x.name)).toEqual(['Action']);
  });

  it('detail returns null for missing id', async () => {
    expect(await service.detail(999)).toBeNull();
  });

  it('update patches fields and returns the row', async () => {
    const a = await seedAnime({ title: 'Old' });
    const updated = await service.update(a.id, { title: 'New' });
    expect(updated?.title).toBe('New');
  });

  it('delete removes the anime and its anime_genre rows; returns true', async () => {
    const a = await seedAnime();
    const g = await ds.getRepository(Genre).save({ name: 'Action', slug: 'action' } as Genre);
    await ds.getRepository(AnimeGenre).save({ animeId: a.id, genreId: g.id } as AnimeGenre);
    const ok = await service.remove(a.id);
    expect(ok).toBe(true);
    expect(await ds.getRepository(Anime).findOneBy({ id: a.id })).toBeNull();
    expect(await ds.getRepository(AnimeGenre).findOneBy({ animeId: a.id })).toBeNull();
  });

  it('delete returns false for missing id', async () => {
    expect(await service.remove(999)).toBeFalsy();
  });
});
