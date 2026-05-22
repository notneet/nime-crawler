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
    animeService.list.mockResolvedValue({ rows: [], total: 45, page: 2, pageSize: 20 });
    const vm = await controller.list('foo', '2');
    expect(animeService.list).toHaveBeenCalledWith('foo', 2, 20);
    expect(vm).toMatchObject({ q: 'foo', page: 2, total: 45, hasPrev: true, hasNext: true, prevPage: 1, nextPage: 3 });
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

  it('update returns ok flash', async () => {
    animeService.update.mockResolvedValue({ id: 1 } as Anime);
    const vm = await controller.update('1', { title: 'New' });
    expect(animeService.update).toHaveBeenCalledWith(1, { title: 'New' });
    expect(vm).toEqual({ ok: true, message: 'Saved' });
  });

  it('recrawl publishes and returns ok flash', async () => {
    animeService.detail.mockResolvedValue({ anime: { source: 'otakudesu', url: 'https://a/1' } as Anime, episodes: [], genres: [] });
    const vm = await controller.recrawl('1');
    expect(recrawl.anime).toHaveBeenCalledWith('otakudesu', 'https://a/1');
    expect(vm).toEqual({ ok: true, message: 'Re-crawl queued' });
  });

  it('remove deletes and redirects to /anime', async () => {
    animeService.remove.mockResolvedValue(true);
    const res = { redirect: jest.fn() } as unknown as Response;
    await controller.remove('1', res);
    expect(animeService.remove).toHaveBeenCalledWith(1);
    expect(res.redirect).toHaveBeenCalledWith('/anime');
  });
});
