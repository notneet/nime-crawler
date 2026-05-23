import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CrawlJobDto } from './crawl-job.dto';

function validate(payload: unknown) {
  const dto = plainToInstance(CrawlJobDto, payload);
  return validateSync(dto);
}

const validAdapter = {
  source: 'otakudesu',
  baseUrl: 'https://otakudesu.blog',
  enabled: true,
  stages: { detail: { engine: 'xpath', patterns: [] } },
};

describe('CrawlJobDto', () => {
  it('accepts a valid job', () => {
    const errors = validate({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x-sub-indo/',
      adapter: validAdapter,
    });
    expect(errors).toHaveLength(0);
  });

  it('accepts a disabled adapter snapshot', () => {
    const dto = plainToInstance(CrawlJobDto, {
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
      adapter: { ...validAdapter, enabled: false },
    });
    expect(validateSync(dto)).toHaveLength(0);
  });

  it('rejects a job whose adapter.baseUrl is not a URL', () => {
    const dto = plainToInstance(CrawlJobDto, {
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
      adapter: { ...validAdapter, baseUrl: 'not-a-url' },
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects a job whose adapter.enabled is not a boolean', () => {
    const dto = plainToInstance(CrawlJobDto, {
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
      adapter: { ...validAdapter, enabled: 'yes' },
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects a job with no adapter', () => {
    const dto = plainToInstance(CrawlJobDto, {
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x/',
    });
    expect(validateSync(dto).length).toBeGreaterThan(0);
  });

  it('rejects an unknown stage', () => {
    const errors = validate({ source: 'otakudesu', stage: 'nope', url: 'https://x.test' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects a non-URL', () => {
    const errors = validate({ source: 'otakudesu', stage: 'index', url: 'not-a-url' });
    expect(errors.length).toBeGreaterThan(0);
  });
});
