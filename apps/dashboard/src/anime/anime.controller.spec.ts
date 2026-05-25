import type { Response } from 'express';
import { AnimeController } from './anime.controller';
import { AnimeService } from './anime.service';
import { RecrawlService } from '../recrawl/recrawl.service';
import { Anime } from '@libs/commons/entities';

describe('AnimeController', () => {
  const animeService = {
    list: jest.fn(),
    detail: jest.fn(),
    episodesOf: jest.fn(),
    mirrorsOf: jest.fn(),
    downloadsOf: jest.fn(),
    batchOf: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    link: jest.fn(),
    unlink: jest.fn(),
  };
  const recrawl = { anime: jest.fn() };
  const controller = new AnimeController(
    animeService as unknown as AnimeService,
    recrawl as unknown as RecrawlService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('list builds pagination view-model', async () => {
    animeService.list.mockResolvedValue({ rows: [], total: 45, page: 2, pageSize: 10 });
    const vm = await controller.list('foo', '2', '');
    expect(animeService.list).toHaveBeenCalledWith('foo', 2, 10);
    expect(vm.q).toBe('foo');
    expect(vm.pager).toMatchObject({ page: 2, total: 45, limit: 10, lastPage: 5, hasPrev: true, hasNext: true });
  });

  it('list clamps limit to the allowed set (default 10)', async () => {
    animeService.list.mockResolvedValue({ rows: [], total: 5, page: 1, pageSize: 10 });
    await controller.list('', '1', '999');
    expect(animeService.list).toHaveBeenCalledWith('', 1, 10);
  });

  it('list honors an allowed limit', async () => {
    animeService.list.mockResolvedValue({ rows: [], total: 5, page: 1, pageSize: 50 });
    await controller.list('', '1', '50');
    expect(animeService.list).toHaveBeenCalledWith('', 1, 50);
  });

  it('detail renders the detail view-model', async () => {
    const detail = { anime: { id: 1 } as Anime, episodes: [], genres: [], isAlias: false };
    animeService.detail.mockResolvedValue(detail);
    const res = { render: jest.fn(), redirect: jest.fn() } as unknown as Response;
    await controller.detail('1', res);
    expect(res.render).toHaveBeenCalledWith('anime-detail', detail);
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('detail redirects to canonical when alias', async () => {
    const detail = { anime: { id: 5 } as Anime, episodes: [], genres: [], isAlias: true };
    animeService.detail.mockResolvedValue(detail);
    const res = { render: jest.fn(), redirect: jest.fn() } as unknown as Response;
    await controller.detail('1', res);
    expect(res.redirect).toHaveBeenCalledWith(302, '/anime/5');
    expect(res.render).not.toHaveBeenCalled();
  });

  it('detail renders 404 when missing', async () => {
    animeService.detail.mockResolvedValue(null);
    const res = { render: jest.fn(), redirect: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.detail('999', res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.any(Object));
  });

  it('episodes returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, episodes: [], total: 12 };
    animeService.episodesOf.mockResolvedValue(data);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.episodes('1', '2', '10', res);
    expect(animeService.episodesOf).toHaveBeenCalledWith(1, 2, 10);
    expect(res.render).toHaveBeenCalledWith('anime-episodes', expect.objectContaining({ anime: data.anime, pager: expect.objectContaining({ baseUrl: '/anime/1/episodes', page: 2, limit: 10, total: 12 }) }));
  });

  it('episodes renders 404 when missing', async () => {
    animeService.episodesOf.mockResolvedValue(null);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.episodes('9', '1', '', res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.any(Object));
  });

  it('mirrors returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, rows: [], total: 3 };
    animeService.mirrorsOf.mockResolvedValue(data);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.mirrors('1', '1', '', res);
    expect(animeService.mirrorsOf).toHaveBeenCalledWith(1, 1, 10);
    expect(res.render).toHaveBeenCalledWith('anime-mirrors', expect.objectContaining({ pager: expect.objectContaining({ baseUrl: '/anime/1/mirrors', total: 3 }) }));
  });

  it('mirrors renders 404 when missing', async () => {
    animeService.mirrorsOf.mockResolvedValue(null);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.mirrors('9', '1', '', res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.any(Object));
  });

  it('downloads returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, rows: [], total: 7 };
    animeService.downloadsOf.mockResolvedValue(data);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.downloads('1', '1', '', res);
    expect(animeService.downloadsOf).toHaveBeenCalledWith(1, 1, 10);
    expect(res.render).toHaveBeenCalledWith('anime-downloads', expect.objectContaining({ pager: expect.objectContaining({ baseUrl: '/anime/1/downloads', total: 7 }) }));
  });

  it('downloads renders 404 when missing', async () => {
    animeService.downloadsOf.mockResolvedValue(null);
    const res = { render: jest.fn(), status: jest.fn().mockReturnThis() } as unknown as Response;
    await controller.downloads('9', '1', '', res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.render).toHaveBeenCalledWith('not-found', expect.any(Object));
  });

  it('update returns ok flash', async () => {
    animeService.update.mockResolvedValue({ id: 1 } as Anime);
    const vm = await controller.update('1', { title: 'New' });
    expect(animeService.update).toHaveBeenCalledWith(1, { title: 'New' });
    expect(vm).toEqual({ ok: true, message: 'Saved', layout: false });
  });

  it('recrawl publishes and returns ok flash', async () => {
    animeService.detail.mockResolvedValue({ anime: { source: 'otakudesu', url: 'https://a/1' } as Anime, episodes: [], genres: [] });
    const vm = await controller.recrawl('1');
    expect(recrawl.anime).toHaveBeenCalledWith('otakudesu', 'https://a/1');
    expect(vm).toEqual({ ok: true, message: 'Re-crawl queued', layout: false });
  });

  it('link returns ok flash when successful', async () => {
    animeService.link.mockResolvedValue({ ok: true });
    const vm = await controller.link('2', { canonicalId: 1 });
    expect(animeService.link).toHaveBeenCalledWith(2, 1);
    expect(vm).toEqual({ ok: true, message: 'Linked as alias', layout: false });
  });

  it('link returns error flash when failed', async () => {
    animeService.link.mockResolvedValue({ ok: false, error: 'Would create cycle' });
    const vm = await controller.link('2', { canonicalId: 1 });
    expect(vm).toEqual({ ok: false, message: 'Would create cycle', layout: false });
  });

  it('unlink returns ok flash when successful', async () => {
    animeService.unlink.mockResolvedValue(true);
    const vm = await controller.unlink('2');
    expect(animeService.unlink).toHaveBeenCalledWith(2);
    expect(vm).toEqual({ ok: true, message: 'Unlinked', layout: false });
  });

  it('unlink returns error flash when not alias', async () => {
    animeService.unlink.mockResolvedValue(false);
    const vm = await controller.unlink('2');
    expect(vm).toEqual({ ok: false, message: 'Not an alias', layout: false });
  });

  it('remove deletes and redirects to /anime', async () => {
    animeService.remove.mockResolvedValue(true);
    const res = { redirect: jest.fn() } as unknown as Response;
    await controller.remove('1', res);
    expect(animeService.remove).toHaveBeenCalledWith(1);
    expect(res.redirect).toHaveBeenCalledWith('/anime');
  });
});
