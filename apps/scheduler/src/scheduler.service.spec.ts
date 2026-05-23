import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SchedulerService } from './scheduler.service';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';
import type { AdapterService } from '@libs/commons/adapters/adapter.service';

describe('SchedulerService', () => {
  const amqp = { publish: jest.fn() };
  const adapters = {
    enabledAdapters: jest.fn().mockResolvedValue([otakudesuAdapter]),
  };
  const service = new SchedulerService(
    amqp as unknown as AmqpConnection,
    adapters as unknown as AdapterService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('seeds an index job per enabled adapter, carrying the snapshot', async () => {
    await service.seedAll();
    expect(adapters.enabledAdapters).toHaveBeenCalledTimes(1);
    expect(amqp.publish).toHaveBeenCalledTimes(1);
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

  it('seeds one job per enabled adapter when multiple are enabled', async () => {
    const second = { ...otakudesuAdapter, source: 'samehadaku', baseUrl: 'https://samehadaku.email' };
    adapters.enabledAdapters.mockResolvedValueOnce([otakudesuAdapter, second]);
    await service.seedAll();
    expect(amqp.publish).toHaveBeenCalledTimes(2);
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.index.samehadaku',
      expect.objectContaining({ source: 'samehadaku', url: 'https://samehadaku.email/', adapter: second }),
    );
  });

  it('publishes nothing when no adapters are enabled', async () => {
    adapters.enabledAdapters.mockResolvedValueOnce([]);
    await service.seedAll();
    expect(amqp.publish).not.toHaveBeenCalled();
  });
});
