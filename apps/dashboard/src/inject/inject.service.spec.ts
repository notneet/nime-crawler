import { BadRequestException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectService } from './inject.service';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';

describe('InjectService', () => {
  const adapter = {
    source: 'otakudesu',
    baseUrl: 'https://otakudesu.example',
    enabled: true,
    stages: {
      detail: { engine: 'xpath', patterns: [] },
      episode: { engine: 'xpath', patterns: [] },
    },
  };
  const adapters = {
    enabledAdapters: jest.fn(),
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const amqp = { publish: jest.fn() };
  const service = new InjectService(
    adapters as unknown as AdapterService,
    amqp as unknown as AmqpConnection,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    adapters.enabledAdapters.mockResolvedValue([adapter]);
    adapters.get.mockResolvedValue(adapter);
    adapters.getOrThrow.mockResolvedValue(adapter);
  });

  it('sources maps enabled adapters to source/baseUrl/stages', async () => {
    expect(await service.sources()).toEqual([
      { source: 'otakudesu', baseUrl: 'https://otakudesu.example', stages: ['detail', 'episode'] },
    ]);
  });

  it('inject publishes a crawl job for a valid request', async () => {
    await service.inject('otakudesu', 'detail', '  https://otakudesu.example/anime/x  ');
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.detail.otakudesu',
      expect.objectContaining({
        source: 'otakudesu',
        stage: 'detail',
        url: 'https://otakudesu.example/anime/x',
        adapter,
      }),
    );
  });

  it('rejects an unknown source', async () => {
    adapters.get.mockResolvedValue(undefined);
    await expect(service.inject('nope', 'detail', 'https://nope/x')).rejects.toBeInstanceOf(BadRequestException);
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('rejects a stage the adapter does not define', async () => {
    await expect(service.inject('otakudesu', 'batch', 'https://otakudesu.example/x')).rejects.toBeInstanceOf(BadRequestException);
    expect(amqp.publish).not.toHaveBeenCalled();
  });

  it('rejects a url that does not start with the adapter baseUrl', async () => {
    await expect(service.inject('otakudesu', 'detail', 'https://evil.example/x')).rejects.toBeInstanceOf(BadRequestException);
    expect(amqp.publish).not.toHaveBeenCalled();
  });
});
