import { BadRequestException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectService } from './inject.service';
import { SiteRegistry } from '@libs/commons/adapters/site-registry';
import { EXCHANGES } from '@libs/commons/messaging/exchanges';

describe('InjectService', () => {
  const adapter = {
    source: 'otakudesu',
    baseUrl: 'https://otakudesu.example',
    enabled: true,
    stages: { detail: {}, episode: {} },
  };
  const registry = {
    enabledSources: jest.fn(),
    get: jest.fn(),
    getOrThrow: jest.fn(),
  };
  const amqp = { publish: jest.fn() };
  const service = new InjectService(
    registry as unknown as SiteRegistry,
    amqp as unknown as AmqpConnection,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    registry.enabledSources.mockReturnValue(['otakudesu']);
    registry.get.mockReturnValue(adapter);
    registry.getOrThrow.mockReturnValue(adapter);
  });

  it('sources maps enabled adapters to source/baseUrl/stages', () => {
    expect(service.sources()).toEqual([
      { source: 'otakudesu', baseUrl: 'https://otakudesu.example', stages: ['detail', 'episode'] },
    ]);
  });

  it('inject publishes a crawl job for a valid request', async () => {
    await service.inject('otakudesu', 'detail', '  https://otakudesu.example/anime/x  ');
    expect(amqp.publish).toHaveBeenCalledWith(
      EXCHANGES.crawl,
      'crawl.detail.otakudesu',
      { source: 'otakudesu', stage: 'detail', url: 'https://otakudesu.example/anime/x' },
    );
  });

  it('rejects an unknown source', async () => {
    registry.get.mockReturnValue(undefined);
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
