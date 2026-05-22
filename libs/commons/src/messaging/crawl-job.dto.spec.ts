import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CrawlJobDto } from './crawl-job.dto';

function validate(payload: unknown) {
  const dto = plainToInstance(CrawlJobDto, payload);
  return validateSync(dto);
}

describe('CrawlJobDto', () => {
  it('accepts a valid job', () => {
    const errors = validate({
      source: 'otakudesu',
      stage: 'detail',
      url: 'https://otakudesu.blog/anime/x-sub-indo/',
    });
    expect(errors).toHaveLength(0);
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
