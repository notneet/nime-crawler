jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({
  ScraperHtmlModule: { forRoot: () => ({ module: class ScraperHtmlModule {} }) },
}));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({
  BrowserActionModule: { forRoot: () => ({ module: class BrowserActionModule {} }) },
}));

import { DataSource, Repository } from 'typeorm';
import { ParsedResultDto } from '@libs/commons';
import { CrawlResult } from './crawl-result.entity';
import { ResultStoreService } from './result-store.service';

describe('ResultStoreService', () => {
  let dataSource: DataSource;
  let repo: Repository<CrawlResult>;
  let service: ResultStoreService;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: ':memory:',
      entities: [CrawlResult],
      synchronize: true,
    });
    await dataSource.initialize();
    repo = dataSource.getRepository(CrawlResult);
    service = new ResultStoreService(repo);
  });

  afterEach(async () => {
    await dataSource.destroy();
  });

  const result = (over: Partial<ParsedResultDto> = {}): ParsedResultDto => ({
    source: 'otakudesu',
    stage: 'detail',
    url: 'https://otakudesu.blog/anime/foo/',
    data: { title: 'Foo' },
    ...over,
  });

  it('persists a parsed result', async () => {
    await service.handle(result());
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/foo/',
      data: { title: 'Foo' },
    });
  });

  it('upserts on (source, url, stage) instead of duplicating', async () => {
    await service.handle(result({ data: { title: 'Old' } }));
    await service.handle(result({ data: { title: 'New' } }));
    const rows = await repo.find();
    expect(rows).toHaveLength(1);
    expect(rows[0].data).toEqual({ title: 'New' });
  });

  it('keeps separate rows for different stages of the same url', async () => {
    await service.handle(result({ stage: 'detail' }));
    await service.handle(result({ stage: 'episode' }));
    expect(await repo.count()).toBe(2);
  });
});
