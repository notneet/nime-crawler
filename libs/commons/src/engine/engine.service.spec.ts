jest.mock('@hanivanrizky/nestjs-xpath-parser', () => ({ ScraperHtmlService: class {} }));
jest.mock('@hanivanrizky/nestjs-browser-action', () => ({ BrowserActionService: class {} }));

import { EngineService } from './engine.service';
import { StageConfig } from '../adapters/site-adapter.types';

describe('EngineService', () => {
  const xpath = { evaluateWebsite: jest.fn() };
  const browser = { scrapeWithWorkflow: jest.fn() };
  const service = new EngineService(
    xpath as unknown as ScraperHtmlService,
    browser as unknown as BrowserActionService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('routes xpath stages to ScraperHtmlService and returns the first result object', async () => {
    xpath.evaluateWebsite.mockResolvedValue({ results: [{ title: 'X' }], document: {} });
    const cfg: StageConfig = { engine: 'xpath', patterns: [{ key: 'title' }] };
    const out = await service.parse(cfg, 'https://x.test');
    expect(xpath.evaluateWebsite).toHaveBeenCalledWith({
      url: 'https://x.test',
      patterns: [{ key: 'title' }],
    });
    expect(out).toEqual({ title: 'X' });
  });

  it('returns an empty object when xpath yields no results', async () => {
    xpath.evaluateWebsite.mockResolvedValue({ results: [], document: {} });
    const out = await service.parse({ engine: 'xpath', patterns: [{ key: 'title' }] }, 'https://x.test');
    expect(out).toEqual({});
  });

  it('routes browser stages to scrapeWithWorkflow(url, workflow) and returns data', async () => {
    browser.scrapeWithWorkflow.mockResolvedValue({ success: true, data: { video: 'v' }, errors: [] });
    const cfg: StageConfig = { engine: 'browser', workflow: { version: '1.0', actions: [] } };
    const out = await service.parse(cfg, 'https://x.test/ep');
    expect(browser.scrapeWithWorkflow).toHaveBeenCalledWith('https://x.test/ep', {
      version: '1.0',
      actions: [],
    });
    expect(out).toEqual({ video: 'v' });
  });

  it('returns { [collect]: results[] } when collect is set', async () => {
    xpath.evaluateWebsite.mockResolvedValue({ results: [{ a: 1 }, { a: 2 }], document: {} });
    const cfg: StageConfig = { engine: 'xpath', patterns: [{ key: 'a' }], collect: 'rows' };
    const out = await service.parse(cfg, 'https://x.test');
    expect(out).toEqual({ rows: [{ a: 1 }, { a: 2 }] });
  });

  it('returns first result when collect is not set', async () => {
    xpath.evaluateWebsite.mockResolvedValue({ results: [{ a: 1 }, { a: 2 }], document: {} });
    const cfg: StageConfig = { engine: 'xpath', patterns: [{ key: 'a' }] };
    const out = await service.parse(cfg, 'https://x.test');
    expect(out).toEqual({ a: 1 });
  });

  it('throws when xpath stage has no patterns', async () => {
    await expect(service.parse({ engine: 'xpath' }, 'https://x.test')).rejects.toThrow(/patterns/);
  });

  it('throws when browser stage has no workflow', async () => {
    await expect(service.parse({ engine: 'browser' }, 'https://x.test')).rejects.toThrow(/workflow/);
  });
});
