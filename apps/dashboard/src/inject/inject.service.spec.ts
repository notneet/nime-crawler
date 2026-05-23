jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({ ScraperHtmlService: class {} }));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionService: class {},
  PageService: class {},
}));

import { BadRequestException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { InjectService } from './inject.service';
import { AdapterService } from '@libs/commons/adapters/adapter.service';
import { EngineService } from '@libs/commons/engine/engine.service';
import { StageConfig } from '@libs/commons/adapters/site-adapter.types';
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
  const engine = { parse: jest.fn() };
  const service = new InjectService(
    adapters as unknown as AdapterService,
    amqp as unknown as AmqpConnection,
    engine as unknown as EngineService,
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

  it('test parses with the stage config and returns the result', async () => {
    engine.parse.mockResolvedValue({ title: 'X' });
    const out = await service.test('otakudesu', 'detail', '  https://otakudesu.example/anime/x  ');
    expect(engine.parse).toHaveBeenCalledWith(adapter.stages.detail, 'https://otakudesu.example/anime/x');
    expect(out).toEqual({ title: 'X' });
  });

  it('test rejects a url outside the adapter baseUrl and does not parse', async () => {
    await expect(service.test('otakudesu', 'detail', 'https://evil.example/x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(engine.parse).not.toHaveBeenCalled();
  });

  it('test rejects a stage the adapter does not define and does not parse', async () => {
    await expect(service.test('otakudesu', 'batch', 'https://otakudesu.example/x')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(engine.parse).not.toHaveBeenCalled();
  });

  it('testConfig parses the given config and returns the result', async () => {
    engine.parse.mockResolvedValue({ a: 1 });
    const cfg: StageConfig = { engine: 'xpath', patterns: [] };
    const out = await service.testConfig(cfg, '  https://otakudesu.example/x  ', 'https://otakudesu.example');
    expect(engine.parse).toHaveBeenCalledWith(cfg, 'https://otakudesu.example/x');
    expect(out).toEqual({ a: 1 });
  });

  it('testConfig rejects a url outside baseUrl and does not parse', async () => {
    const cfg: StageConfig = { engine: 'xpath', patterns: [] };
    await expect(service.testConfig(cfg, 'https://evil.example/x', 'https://otakudesu.example')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(engine.parse).not.toHaveBeenCalled();
  });
});
