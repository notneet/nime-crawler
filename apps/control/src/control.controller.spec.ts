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
import { ControlController } from './control.controller';
import { SiteRegistry, otakudesuAdapter, EXCHANGES } from '@libs/commons';

describe('ControlController', () => {
  const amqp = { publish: jest.fn() };
  const registry = new SiteRegistry([otakudesuAdapter]);
  const controller = new ControlController(amqp as unknown as AmqpConnection, registry);

  beforeEach(() => jest.clearAllMocks());

  it('on a crawl.trigger event, publishes an index job for the requested site', async () => {
    await controller.onTrigger({ source: 'otakudesu' });
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.index.otakudesu',
      expect.objectContaining({ source: 'otakudesu', stage: 'index', url: 'https://otakudesu.blog/' }),
    );
  });

  it('throws for an unknown site', async () => {
    await expect(controller.onTrigger({ source: 'nope' })).rejects.toThrow(/unknown site/i);
  });
});
