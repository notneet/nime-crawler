import { DataSource } from 'typeorm';
import { Adapter } from './adapter.entity';

describe('Adapter entity', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [Adapter],
      synchronize: true,
    });
    await ds.initialize();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('persists and reads back an adapter with a JSON stages column', async () => {
    const repo = ds.getRepository(Adapter);
    await repo.insert({
      source: 'demo',
      baseUrl: 'https://demo.test',
      enabled: true,
      stages: { index: { engine: 'xpath', patterns: [] } },
    });
    const row = await repo.findOneByOrFail({ source: 'demo' });
    expect(row.id).toBeGreaterThan(0);
    expect(row.enabled).toBe(true);
    expect(row.stages.index?.engine).toBe('xpath');
    expect(row.createdAt).toBeInstanceOf(Date);
  });

  it('rejects a duplicate source (unique index)', async () => {
    const repo = ds.getRepository(Adapter);
    await repo.insert({ source: 'dup', baseUrl: 'https://a.test', enabled: true, stages: {} });
    await expect(
      repo.insert({ source: 'dup', baseUrl: 'https://b.test', enabled: true, stages: {} }),
    ).rejects.toThrow(/UNIQUE/i);
  });
});
