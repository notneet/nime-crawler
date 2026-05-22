jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({
  ScraperHtmlModule: { forRoot: () => ({ module: class ScraperHtmlModule {} }) },
}));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionModule: { forRoot: () => ({ module: class BrowserActionModule {} }) },
}));

import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { SinkService } from './sink.service';
import { EXCHANGES } from '@libs/commons';

describe('SinkService', () => {
  const amqp = { publish: jest.fn() };
  const service = new SinkService(amqp as unknown as AmqpConnection);

  beforeEach(() => jest.clearAllMocks());

  it('republishes a parsed result to the public results exchange', async () => {
    await service.handle({
      source: 'otakudesu',
      stage: 'episode',
      url: 'https://otakudesu.blog/episode/a/',
      data: { video: 'https://cdn/x.mp4' },
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.results,
      'result.episode.otakudesu',
      expect.objectContaining({ source: 'otakudesu', data: { video: 'https://cdn/x.mp4' } }),
    );
  });
});
