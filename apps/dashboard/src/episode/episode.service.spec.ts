import { DataSource, Repository } from 'typeorm';
import type { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink, DownloadArchive } from '@libs/commons/entities';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { EpisodeService } from './episode.service';

describe('EpisodeService', () => {
  let ds: DataSource;
  let service: EpisodeService;
  let amqp: { publish: jest.Mock };

  beforeEach(async () => {
    ds = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Anime, Genre, AnimeGenre, Episode, Mirror, DownloadLink],
      synchronize: true,
    });
    await ds.initialize();
    amqp = { publish: jest.fn() };
    service = new EpisodeService(
      ds.getRepository(Episode),
      ds.getRepository(Mirror),
      ds.getRepository(DownloadLink),
      { findBy: jest.fn().mockResolvedValue([]) } as unknown as Repository<DownloadArchive>,
      amqp as unknown as AmqpConnection,
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

  it('deleteMirror removes a single mirror by id', async () => {
    const e = await seedEpisode();
    const m = await ds.getRepository(Mirror).save({ episodeUrl: e.url, quality: '720p', host: 'mega' } as Mirror);
    expect(await service.deleteMirror(m.id)).toBe(true);
    expect(await ds.getRepository(Mirror).findOneBy({ id: m.id })).toBeNull();
  });

  it('deleteMirror returns false for missing id', async () => {
    expect(await service.deleteMirror(999)).toBe(false);
  });

  it('deleteDownload removes a single download by id', async () => {
    const e = await seedEpisode();
    const d = await ds
      .getRepository(DownloadLink)
      .save({ source: 'otakudesu', ownerUrl: e.url, kind: 'episode', url: 'https://dl/1' } as DownloadLink);
    expect(await service.deleteDownload(d.id)).toBe(true);
    expect(await ds.getRepository(DownloadLink).findOneBy({ id: d.id })).toBeNull();
  });

  it('deleteDownload returns false for missing id', async () => {
    expect(await service.deleteDownload(999)).toBe(false);
  });

  it('archive publishes a download job and returns ok', async () => {
    const e = await seedEpisode();
    const res = await service.archive(e.id);
    expect(amqp.publish).toHaveBeenCalledTimes(1);
    expect(amqp.publish).toHaveBeenCalledWith(EXCHANGES.download, 'download.episode.otakudesu', {
      episodeId: e.id,
      source: 'otakudesu',
      manual: true,
    });
    expect(res.ok).toBe(true);
  });

  it('archive returns not-found and does not publish for missing id', async () => {
    const res = await service.archive(999);
    expect(res).toEqual({ ok: false, message: 'episode not found' });
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('archive with episodeStream resolves the episode stream url server-side', async () => {
    const e = await seedEpisode();
    await ds.getRepository(Episode).update(e.id, { streamUrl: 'https://desustream.info/p/9' } as Partial<Episode>);
    const res = await service.archive(e.id, { episodeStream: true });
    expect(res.ok).toBe(true);
    expect(amqp.publish).toHaveBeenCalledWith(EXCHANGES.download, 'download.episode.otakudesu', {
      episodeId: e.id,
      source: 'otakudesu',
      manual: true,
      mirrorId: undefined,
      streamUrl: 'https://desustream.info/p/9',
    });
  });

  it('archive with episodeStream errors when episode has no stream url', async () => {
    const e = await seedEpisode();
    const res = await service.archive(e.id, { episodeStream: true });
    expect(res).toEqual({ ok: false, message: 'episode has no stream url' });
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('resolvableMirrors lists only mirrors with a streamUrl, high→low, with highest/lowest', async () => {
    const e = await seedEpisode();
    const repo = ds.getRepository(Mirror);
    await repo.save({ episodeUrl: e.url, quality: '480p', host: 'a', streamUrl: 'https://s/480' } as Mirror);
    await repo.save({ episodeUrl: e.url, quality: '1080p', host: 'b', streamUrl: 'https://s/1080' } as Mirror);
    await repo.save({ episodeUrl: e.url, quality: '720p', host: 'c', streamUrl: 'https://s/720' } as Mirror);
    await repo.save({ episodeUrl: e.url, quality: '720p', host: 'd', streamUrl: null } as unknown as Mirror);
    const res = await service.resolvableMirrors(e.id);
    expect(res?.mirrors.map((m) => m.quality)).toEqual(['1080p', '720p', '480p']);
    expect(res?.highest?.quality).toBe('1080p');
    expect(res?.lowest?.quality).toBe('480p');
  });

  it('resolvableMirrors highest/lowest are null when no resolvable mirrors', async () => {
    const e = await seedEpisode();
    const res = await service.resolvableMirrors(e.id);
    expect(res?.mirrors).toHaveLength(0);
    expect(res?.highest).toBeNull();
    expect(res?.lowest).toBeNull();
  });

  it('resolvableMirrors returns null for missing episode', async () => {
    expect(await service.resolvableMirrors(999)).toBeNull();
  });
});
