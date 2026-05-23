import { AdapterService } from './adapter.service';
import type { Repository } from 'typeorm';
import type { Adapter } from '../entities/adapter.entity';

function makeRepo(rows: Partial<Adapter>[]) {
  return {
    findOneBy: jest.fn(async ({ source }: { source: string }) => rows.find((r) => r.source === source) ?? null),
    findBy: jest.fn(async ({ enabled }: { enabled: boolean }) => rows.filter((r) => r.enabled === enabled)),
  } as unknown as Repository<Adapter>;
}

const row = {
  id: 1,
  source: 'otakudesu',
  baseUrl: 'https://otakudesu.blog',
  enabled: true,
  stages: { index: { engine: 'xpath', patterns: [] } },
  createdAt: new Date(),
  updatedAt: new Date(),
} satisfies Adapter;

describe('AdapterService', () => {
  it('get() returns a SiteAdapter-shaped object (no entity-only columns)', async () => {
    const svc = new AdapterService(makeRepo([row]));
    const a = await svc.get('otakudesu');
    expect(a).toEqual({
      source: 'otakudesu',
      baseUrl: 'https://otakudesu.blog',
      enabled: true,
      stages: { index: { engine: 'xpath', patterns: [] } },
    });
  });

  it('get() returns undefined for an unknown source', async () => {
    const svc = new AdapterService(makeRepo([row]));
    expect(await svc.get('nope')).toBeUndefined();
  });

  it('getOrThrow() throws for an unknown source', async () => {
    const svc = new AdapterService(makeRepo([row]));
    await expect(svc.getOrThrow('nope')).rejects.toThrow('unknown site: nope');
  });

  it('enabledAdapters() returns only enabled rows, mapped', async () => {
    const svc = new AdapterService(makeRepo([row, { ...row, source: 'off', enabled: false }]));
    const list = await svc.enabledAdapters();
    expect(list.map((a) => a.source)).toEqual(['otakudesu']);
  });
});
