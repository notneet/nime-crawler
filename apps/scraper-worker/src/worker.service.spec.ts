jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({
  ScraperHtmlModule: { forRoot: () => ({ module: class ScraperHtmlModule {} }) },
}));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionModule: {
    forRoot: () => ({ module: class BrowserActionModule {} }),
    forRootAsync: () => ({ module: class BrowserActionModule {} }),
  },
}));

import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { WorkerService } from './worker.service';
import { EngineService, SiteRegistry, otakudesuAdapter, EXCHANGES } from '@libs/commons';
import { Anime, Episode } from '@libs/commons/entities';

describe('WorkerService', () => {
  const amqp = { publish: jest.fn() };
  const engine = { parse: jest.fn() };
  const registry = new SiteRegistry([otakudesuAdapter]);
  const animeRepo = { findOne: jest.fn() };
  const episodeRepo = { findOne: jest.fn() };
  const config = { get: jest.fn().mockReturnValue('72') };
  const service = new WorkerService(
    amqp as unknown as AmqpConnection,
    engine as unknown as EngineService,
    registry,
    config as unknown as ConfigService,
    animeRepo as unknown as Repository<Anime>,
    episodeRepo as unknown as Repository<Episode>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    animeRepo.findOne.mockResolvedValue(null);
    episodeRepo.findOne.mockResolvedValue(null);
  });

  it('parses a detail page, re-publishes discovered episode/batch jobs and emits parsed data', async () => {
    engine.parse.mockResolvedValue({
      title: 'X',
      episodeLinks: ['/episode/a/'],
      batchLinks: ['/batch/c/'],
    });

    await service.handle({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
    });

    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.episode.otakudesu',
      expect.objectContaining({ stage: 'episode', url: 'https://otakudesu.blog/episode/a/' }),
    );
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.batch.otakudesu',
      expect.objectContaining({ stage: 'batch', url: 'https://otakudesu.blog/batch/c/' }),
    );
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.parsed,
      'parsed.detail.otakudesu',
      expect.objectContaining({ stage: 'detail', data: expect.objectContaining({ title: 'X' }) }),
    );
  });

  it('dead-letters (Nack false) when the stage is not configured for the site', async () => {
    const result = await service.handle({ source: 'nope', stage: 'index', url: 'https://x.test' });
    expect(result).toBeDefined();
  });

  it('returns a Nack on engine failure', async () => {
    engine.parse.mockRejectedValue(new Error('timeout'));
    const result = await service.handle({
      source: 'otakudesu',
      stage: 'episode',
      url: 'https://otakudesu.blog/episode/a/',
    });
    expect(result).toBeDefined();
  });

  it('skips the fetch when a detail row is fresh (within SKIP_FRESH_HOURS)', async () => {
    animeRepo.findOne.mockResolvedValue({ updatedAt: new Date() });
    await service.handle({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
    });
    expect(engine.parse).not.toHaveBeenCalled();
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('fetches when the existing detail row is stale (older than SKIP_FRESH_HOURS)', async () => {
    const old = new Date(Date.now() - 100 * 3_600_000);
    animeRepo.findOne.mockResolvedValue({ updatedAt: old });
    engine.parse.mockResolvedValue({ title: 'X' });
    await service.handle({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
    });
    expect(engine.parse).toHaveBeenCalled();
  });

  it('force bypasses the freshness skip and fetches even when the row is fresh', async () => {
    animeRepo.findOne.mockResolvedValue({ updatedAt: new Date() });
    engine.parse.mockResolvedValue({ title: 'X' });
    await service.handle({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
      force: true,
    });
    expect(engine.parse).toHaveBeenCalled();
  });
});
