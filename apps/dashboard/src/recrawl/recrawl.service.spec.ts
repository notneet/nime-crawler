import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';
import { RecrawlService } from './recrawl.service';

describe('RecrawlService', () => {
  const amqp = { publish: jest.fn() };
  const service = new RecrawlService(amqp as unknown as AmqpConnection);

  beforeEach(() => jest.clearAllMocks());

  it('publishes a detail job for an anime', async () => {
    await service.anime('otakudesu', 'https://otakudesu.blog/anime/foo/');
    expect(amqp.publish).toHaveBeenCalledWith(EXCHANGES.crawl, 'crawl.detail.otakudesu', {
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/foo/',
    });
  });

  it('publishes an episode job for an episode', async () => {
    await service.episode('otakudesu', 'https://otakudesu.blog/episode/foo-11/');
    expect(amqp.publish).toHaveBeenCalledWith(EXCHANGES.crawl, 'crawl.episode.otakudesu', {
      source: 'otakudesu',
      stage: 'episode',
      url: 'https://otakudesu.blog/episode/foo-11/',
    });
  });
});
