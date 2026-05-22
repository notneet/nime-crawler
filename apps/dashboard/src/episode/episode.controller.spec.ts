import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { EpisodeController } from './episode.controller';
import { EpisodeService } from './episode.service';
import { RecrawlService } from '../recrawl/recrawl.service';
import { Episode } from '@libs/commons/entities';

describe('EpisodeController', () => {
  const episodeService = { detail: jest.fn(), update: jest.fn(), remove: jest.fn() };
  const recrawl = { episode: jest.fn() };
  const controller = new EpisodeController(
    episodeService as unknown as EpisodeService,
    recrawl as unknown as RecrawlService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('detail returns the view-model', async () => {
    const detail = { episode: { id: 1 } as Episode, mirrors: [], downloads: [] };
    episodeService.detail.mockResolvedValue(detail);
    expect(await controller.detail('1')).toBe(detail);
  });

  it('detail throws 404 when missing', async () => {
    episodeService.detail.mockResolvedValue(null);
    await expect(controller.detail('9')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update returns ok flash', async () => {
    episodeService.update.mockResolvedValue({ id: 1 } as Episode);
    const vm = await controller.update('1', { title: 'X' });
    expect(episodeService.update).toHaveBeenCalledWith(1, { title: 'X' });
    expect(vm).toEqual({ ok: true, message: 'Saved' });
  });

  it('recrawl publishes and returns ok flash', async () => {
    episodeService.detail.mockResolvedValue({ episode: { source: 'otakudesu', url: 'https://e/1' } as Episode, mirrors: [], downloads: [] });
    const vm = await controller.recrawl('1');
    expect(recrawl.episode).toHaveBeenCalledWith('otakudesu', 'https://e/1');
    expect(vm).toEqual({ ok: true, message: 'Re-crawl queued' });
  });

  it('remove deletes and redirects to /anime', async () => {
    episodeService.remove.mockResolvedValue(true);
    const res = { redirect: jest.fn() } as unknown as Response;
    await controller.remove('1', res);
    expect(episodeService.remove).toHaveBeenCalledWith(1);
    expect(res.redirect).toHaveBeenCalledWith('/anime');
  });
});
