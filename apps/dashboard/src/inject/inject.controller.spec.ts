jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({ ScraperHtmlService: class {} }));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionService: class {},
  PageService: class {},
}));

import { BadRequestException } from '@nestjs/common';
import { InjectController } from './inject.controller';
import { InjectService, InjectSource } from './inject.service';
import { InjectDto, TestConfigDto } from './inject.dto';

describe('InjectController', () => {
  const injectService = {
    sources: jest.fn(),
    inject: jest.fn(),
    test: jest.fn(),
    testConfig: jest.fn(),
  };
  const controller = new InjectController(injectService as unknown as InjectService);

  beforeEach(() => jest.clearAllMocks());

  it('page returns sources and a serialized copy for the client', async () => {
    const sources: InjectSource[] = [{ source: 'otakudesu', baseUrl: 'https://o.example', stages: ['detail'] }];
    injectService.sources.mockResolvedValue(sources);
    const vm = await controller.page();
    expect(vm.sources).toBe(sources);
    expect(vm.sourcesJson).toBe(JSON.stringify(sources));
  });

  it('submit injects and returns an ok flash', async () => {
    injectService.inject.mockResolvedValue(undefined);
    const vm = await controller.submit({ source: 'otakudesu', stage: 'detail', url: 'https://o.example/x' });
    expect(injectService.inject).toHaveBeenCalledWith('otakudesu', 'detail', 'https://o.example/x');
    expect(vm).toEqual({ ok: true, message: 'Injected detail · https://o.example/x', layout: false });
  });

  it('submit returns an error flash when inject throws', async () => {
    injectService.inject.mockRejectedValue(new BadRequestException('url must start with https://o.example'));
    const vm = await controller.submit({ source: 'otakudesu', stage: 'detail', url: 'https://evil/x' });
    expect(vm).toEqual({ ok: false, message: 'url must start with https://o.example', layout: false });
  });

  it('test returns ok with the parsed result', async () => {
    injectService.test.mockResolvedValue({ title: 'X' });
    const vm = await controller.test({ source: 'otakudesu', stage: 'detail', url: 'https://o.example/x' } as InjectDto);
    expect(injectService.test).toHaveBeenCalledWith('otakudesu', 'detail', 'https://o.example/x');
    expect(vm).toEqual({ ok: true, stage: 'detail', result: { title: 'X' } });
  });

  it('test returns an error payload when test throws', async () => {
    injectService.test.mockRejectedValue(new BadRequestException('url must start with https://o.example'));
    const vm = await controller.test({ source: 'otakudesu', stage: 'detail', url: 'https://evil/x' } as InjectDto);
    expect(vm).toEqual({ ok: false, error: 'url must start with https://o.example' });
  });

  it('testConfig returns ok with the parsed result', async () => {
    injectService.testConfig.mockResolvedValue({ a: 1 });
    const vm = await controller.testConfig({
      config: { engine: 'xpath' },
      url: 'https://o.example/x',
      baseUrl: 'https://o.example',
      stage: 'detail',
    } as unknown as TestConfigDto);
    expect(injectService.testConfig).toHaveBeenCalledWith({ engine: 'xpath' }, 'https://o.example/x', 'https://o.example');
    expect(vm).toEqual({ ok: true, stage: 'detail', result: { a: 1 } });
  });

  it('testConfig returns an error payload when it throws', async () => {
    injectService.testConfig.mockRejectedValue(new BadRequestException('url must start with https://o.example'));
    const vm = await controller.testConfig({
      config: {},
      url: 'https://evil/x',
      baseUrl: 'https://o.example',
    } as unknown as TestConfigDto);
    expect(vm).toEqual({ ok: false, error: 'url must start with https://o.example' });
  });
});
