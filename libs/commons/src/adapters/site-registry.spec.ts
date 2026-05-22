import { SiteRegistry } from './site-registry';
import { otakudesuAdapter } from './otakudesu.adapter';

describe('SiteRegistry', () => {
  const registry = new SiteRegistry([otakudesuAdapter]);

  it('returns an adapter by source', () => {
    expect(registry.get('otakudesu')?.baseUrl).toBe('https://otakudesu.blog');
  });

  it('throws on unknown source via getOrThrow', () => {
    expect(() => registry.getOrThrow('nope')).toThrow(/unknown site/i);
  });

  it('lists only enabled sites', () => {
    expect(registry.enabledSources()).toContain('otakudesu');
  });

  it('otakudesu defines all four stages with correct engines', () => {
    const a = registry.getOrThrow('otakudesu');
    expect(a.stages.index?.engine).toBe('xpath');
    expect(a.stages.detail?.engine).toBe('xpath');
    expect(a.stages.episode?.engine).toBe('browser');
    expect(a.stages.batch?.engine).toBe('xpath');
  });
});
