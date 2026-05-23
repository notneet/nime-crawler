import { NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { EpisodeController } from './episode.controller';
import { EpisodeService } from './episode.service';
import { RecrawlService } from '../recrawl/recrawl.service';
import { Episode } from '@libs/commons/entities';

describe('EpisodeController', () => {
  const episodeService = {
    detail: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
    remove: jest.fn(),
    deleteMirror: jest.fn(),
    deleteDownload: jest.fn(),
  };
  const recrawl = { episode: jest.fn() };
  const controller = new EpisodeController(
    episodeService as unknown as EpisodeService,
    recrawl as unknown as RecrawlService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('detail returns the view-model with mirror and download pagers', async () => {
    const detail = { episode: { id: 1 } as Episode, mirrors: [], downloads: [], mirrorsTotal: 25, downloadsTotal: 4, player: null, archives: [] };
    episodeService.detail.mockResolvedValue(detail);
    const vm = await controller.detail('1', '2', '10', '1', '20');
    expect(episodeService.detail).toHaveBeenCalledWith(1, 2, 10, 1, 20);
    expect(vm.episode).toBe(detail.episode);
    expect(vm.mirrorsPager).toMatchObject({ baseUrl: '/episode/1', pageParam: 'mp', limitParam: 'ml', page: 2, limit: 10, total: 25 });
    expect(vm.downloadsPager).toMatchObject({ baseUrl: '/episode/1', pageParam: 'dp', limitParam: 'dl', page: 1, limit: 20, total: 4 });
  });

  it('detail throws 404 when missing', async () => {
    episodeService.detail.mockResolvedValue(null);
    await expect(controller.detail('9', '1', '', '1', '')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update returns ok flash', async () => {
    episodeService.update.mockResolvedValue({ id: 1 } as Episode);
    const vm = await controller.update('1', { title: 'X' });
    expect(episodeService.update).toHaveBeenCalledWith(1, { title: 'X' });
    expect(vm).toEqual({ ok: true, message: 'Saved', layout: false });
  });

  it('recrawl publishes and returns ok flash', async () => {
    episodeService.detail.mockResolvedValue({ episode: { source: 'otakudesu', url: 'https://e/1' } as Episode, mirrors: [], downloads: [] });
    const vm = await controller.recrawl('1');
    expect(recrawl.episode).toHaveBeenCalledWith('otakudesu', 'https://e/1');
    expect(vm).toEqual({ ok: true, message: 'Re-crawl queued', layout: false });
  });

  it('archive queues a job and returns ok flash', async () => {
    episodeService.archive.mockResolvedValue({ ok: true, message: 'archive job queued | https://e/1' });
    const vm = await controller.archive('1');
    expect(episodeService.archive).toHaveBeenCalledWith(1);
    expect(vm).toEqual({ ok: true, message: 'archive job queued | https://e/1', layout: false });
  });

  it('archive throws 404 when episode missing', async () => {
    episodeService.archive.mockResolvedValue({ ok: false, message: 'episode not found' });
    await expect(controller.archive('9')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteMirror deletes and returns empty body', async () => {
    episodeService.deleteMirror.mockResolvedValue(true);
    expect(await controller.deleteMirror('5')).toBe('');
    expect(episodeService.deleteMirror).toHaveBeenCalledWith(5);
  });

  it('deleteDownload deletes and returns empty body', async () => {
    episodeService.deleteDownload.mockResolvedValue(true);
    expect(await controller.deleteDownload('7')).toBe('');
    expect(episodeService.deleteDownload).toHaveBeenCalledWith(7);
  });

  it('remove deletes and redirects to /anime', async () => {
    episodeService.remove.mockResolvedValue(true);
    const res = { redirect: jest.fn() } as unknown as Response;
    await controller.remove('1', res);
    expect(episodeService.remove).toHaveBeenCalledWith(1);
    expect(res.redirect).toHaveBeenCalledWith('/anime');
  });
});
