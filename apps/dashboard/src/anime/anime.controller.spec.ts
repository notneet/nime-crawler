import { NotFoundException } from '@nestjs/common';
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
    update: jest.fn(),
    remove: jest.fn(),
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

  it('detail returns the detail view-model', async () => {
    const detail = { anime: { id: 1 } as Anime, episodes: [], genres: [] };
    animeService.detail.mockResolvedValue(detail);
    const vm = await controller.detail('1');
    expect(vm).toBe(detail);
  });

  it('detail throws 404 when missing', async () => {
    animeService.detail.mockResolvedValue(null);
    await expect(controller.detail('999')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('episodes returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, episodes: [], total: 12 };
    animeService.episodesOf.mockResolvedValue(data);
    const vm = await controller.episodes('1', '2', '10');
    expect(animeService.episodesOf).toHaveBeenCalledWith(1, 2, 10);
    expect(vm.anime).toBe(data.anime);
    expect(vm.pager).toMatchObject({ baseUrl: '/anime/1/episodes', page: 2, limit: 10, total: 12, lastPage: 2 });
  });

  it('episodes throws 404 when missing', async () => {
    animeService.episodesOf.mockResolvedValue(null);
    await expect(controller.episodes('9', '1', '')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('mirrors returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, rows: [], total: 3 };
    animeService.mirrorsOf.mockResolvedValue(data);
    const vm = await controller.mirrors('1', '1', '');
    expect(animeService.mirrorsOf).toHaveBeenCalledWith(1, 1, 10);
    expect(vm.pager).toMatchObject({ baseUrl: '/anime/1/mirrors', total: 3 });
  });

  it('mirrors throws 404 when missing', async () => {
    animeService.mirrorsOf.mockResolvedValue(null);
    await expect(controller.mirrors('9', '1', '')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('downloads returns the list view-model with a pager', async () => {
    const data = { anime: { id: 1 } as Anime, rows: [], total: 7 };
    animeService.downloadsOf.mockResolvedValue(data);
    const vm = await controller.downloads('1', '1', '');
    expect(animeService.downloadsOf).toHaveBeenCalledWith(1, 1, 10);
    expect(vm.pager).toMatchObject({ baseUrl: '/anime/1/downloads', total: 7 });
  });

  it('downloads throws 404 when missing', async () => {
    animeService.downloadsOf.mockResolvedValue(null);
    await expect(controller.downloads('9', '1', '')).rejects.toBeInstanceOf(NotFoundException);
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

  it('remove deletes and redirects to /anime', async () => {
    animeService.remove.mockResolvedValue(true);
    const res = { redirect: jest.fn() } as unknown as Response;
    await controller.remove('1', res);
    expect(animeService.remove).toHaveBeenCalledWith(1);
    expect(res.redirect).toHaveBeenCalledWith('/anime');
  });
});
