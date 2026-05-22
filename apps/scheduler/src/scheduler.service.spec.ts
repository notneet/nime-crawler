// The commons barrel re-exports EngineModule, which pulls in jsdom-backed ESM
// packages that jest cannot transform. Stub those modules so the barrel loads.
jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({
  ScraperHtmlModule: { forRoot: () => ({ module: class ScraperHtmlModule {} }) },
}));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionModule: { forRoot: () => ({ module: class BrowserActionModule {} }) },
}));

import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SchedulerService } from './scheduler.service';
import { SiteRegistry, otakudesuAdapter, EXCHANGES } from '@libs/commons';

describe('SchedulerService', () => {
  const amqp = { publish: jest.fn() };
  const registry = new SiteRegistry([otakudesuAdapter]);
  const service = new SchedulerService(amqp as unknown as AmqpConnection, registry);

  beforeEach(() => jest.clearAllMocks());

  it('seedAll publishes an index job per enabled site to the crawl exchange', async () => {
    await service.seedAll();
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.index.otakudesu',
      { source: 'otakudesu', stage: 'index', url: 'https://otakudesu.blog/' },
    );
  });

  it('seedSite throws for an unknown source', async () => {
    await expect(service.seedSite('nope')).rejects.toThrow(/unknown site/i);
  });
});
