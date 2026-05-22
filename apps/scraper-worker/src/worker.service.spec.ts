jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({
  ScraperHtmlModule: { forRoot: () => ({ module: class ScraperHtmlModule {} }) },
}));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionModule: { forRoot: () => ({ module: class BrowserActionModule {} }) },
}));

import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { WorkerService } from './worker.service';
import { EngineService, SiteRegistry, otakudesuAdapter, EXCHANGES } from '@libs/commons';

describe('WorkerService', () => {
  const amqp = { publish: jest.fn() };
  const engine = { parse: jest.fn() };
  const registry = new SiteRegistry([otakudesuAdapter]);
  const service = new WorkerService(
    amqp as unknown as AmqpConnection,
    engine as unknown as EngineService,
    registry,
  );

  beforeEach(() => jest.clearAllMocks());

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
});
