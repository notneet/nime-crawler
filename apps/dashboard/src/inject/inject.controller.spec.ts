import { BadRequestException } from '@nestjs/common';
import { InjectController } from './inject.controller';
import { InjectService, InjectSource } from './inject.service';

describe('InjectController', () => {
  const injectService = {
    sources: jest.fn(),
    inject: jest.fn(),
  };
  const controller = new InjectController(injectService as unknown as InjectService);

  beforeEach(() => jest.clearAllMocks());

  it('page returns sources and a serialized copy for the client', () => {
    const sources: InjectSource[] = [{ source: 'otakudesu', baseUrl: 'https://o.example', stages: ['detail'] }];
    injectService.sources.mockReturnValue(sources);
    const vm = controller.page();
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
});
