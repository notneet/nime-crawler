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
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';
import type { AdapterService } from '@libs/commons/adapters/adapter.service';

describe('ControlController', () => {
  const amqp = { publish: jest.fn() };
  const adapters = {
    getOrThrow: jest.fn().mockResolvedValue(otakudesuAdapter),
  };
  const controller = new ControlController(
    amqp as unknown as AmqpConnection,
    adapters as unknown as AdapterService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('publishes an index job carrying the adapter snapshot on trigger', async () => {
    await controller.onTrigger({ source: 'otakudesu' });
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.index.otakudesu',
      expect.objectContaining({
        source: 'otakudesu',
        stage: 'index',
        url: 'https://otakudesu.blog/',
        adapter: otakudesuAdapter,
      }),
    );
  });

  it('propagates getOrThrow rejection for an unknown site', async () => {
    adapters.getOrThrow.mockRejectedValueOnce(new Error('unknown site: nope'));
    await expect(controller.onTrigger({ source: 'nope' })).rejects.toThrow(/unknown site/i);
    expect(amqp.publish).not.toHaveBeenCalled();
  });
});
