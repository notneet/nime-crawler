import { SiteAdapter } from './site-adapter.types';

describe('SiteAdapter type', () => {
  it('accepts a minimal conforming adapter', () => {
    const adapter: SiteAdapter = {
      source: 'demo',
      baseUrl: 'https://demo.test',
      enabled: true,
      stages: {
        index: {
          engine: 'xpath',
          patterns: [],
          discover: [{ stage: 'detail', fromKey: 'links' }],
        },
      },
    };
    expect(adapter.stages.index?.engine).toBe('xpath');
  });
});
