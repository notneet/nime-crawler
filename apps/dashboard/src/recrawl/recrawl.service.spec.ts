import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RecrawlService } from './recrawl.service';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';

describe('RecrawlService', () => {
  const amqp = { publish: jest.fn() };
  const adapters = { getOrThrow: jest.fn().mockResolvedValue(otakudesuAdapter) };
  const service = new RecrawlService(
    amqp as unknown as AmqpConnection,
    adapters as unknown as AdapterService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('publishes a detail re-crawl carrying force + adapter snapshot', async () => {
    await service.anime('otakudesu', 'https://otakudesu.blog/anime/x/');
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.detail.otakudesu',
      expect.objectContaining({
        source: 'otakudesu',
        stage: 'detail',
        url: 'https://otakudesu.blog/anime/x/',
        force: true,
        adapter: otakudesuAdapter,
      }),
    );
  });

  it('publishes an episode re-crawl carrying force + adapter snapshot', async () => {
    await service.episode('otakudesu', 'https://otakudesu.blog/episode/a/');
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.episode.otakudesu',
      expect.objectContaining({ stage: 'episode', force: true, adapter: otakudesuAdapter }),
    );
  });
});
