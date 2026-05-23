import { buildNextJobs, buildParsedResult } from './job-builder';
import { SiteAdapter } from '../adapters/site-adapter.types';

const adapter: SiteAdapter = {
  source: 'demo',
  baseUrl: 'https://demo.test',
  enabled: true,
  stages: {
    detail: {
      engine: 'xpath',
      patterns: [],
      discover: [
        { stage: 'episode', fromKey: 'episodeLinks' },
        { stage: 'batch', fromKey: 'batchLinks' },
      ],
    },
    episode: { engine: 'browser', workflow: { version: '1.0', actions: [] } },
  },
};

describe('buildNextJobs', () => {
  it('maps discovered url arrays to crawl jobs with absolute urls', () => {
    const jobs = buildNextJobs(adapter, 'detail', {
      episodeLinks: ['/episode/a/', 'https://demo.test/episode/b/'],
      batchLinks: ['/batch/c/'],
    });
    expect(jobs).toEqual([
      { source: 'demo', stage: 'episode', url: 'https://demo.test/episode/a/', adapter },
      { source: 'demo', stage: 'episode', url: 'https://demo.test/episode/b/', adapter },
      { source: 'demo', stage: 'batch', url: 'https://demo.test/batch/c/', adapter },
    ]);
  });

  it('stamps the adapter snapshot onto every discovered job', () => {
    const jobs = buildNextJobs(adapter, 'detail', { episodeLinks: ['/episode/a/'] });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].adapter).toBe(adapter);
    expect(jobs[0]).toMatchObject({
      source: 'demo',
      stage: 'episode',
      url: 'https://demo.test/episode/a/',
    });
  });

  it('returns empty array for a terminal stage (no discover)', () => {
    expect(buildNextJobs(adapter, 'episode', { video: 'x' })).toEqual([]);
  });

  it('ignores discover keys whose value is missing or not an array', () => {
    const jobs = buildNextJobs(adapter, 'detail', { episodeLinks: '/episode/a/' });
    expect(jobs).toEqual([]);
  });

  it('dedupes repeated urls', () => {
    const jobs = buildNextJobs(adapter, 'detail', {
      episodeLinks: ['/episode/a/', '/episode/a/'],
    });
    expect(jobs).toHaveLength(1);
  });
});

describe('buildParsedResult', () => {
  it('packages parsed data into a ParsedResultDto', () => {
    const result = buildParsedResult('demo', 'episode', 'https://demo.test/episode/a/', {
      video: 'https://cdn/x.mp4',
    });
    expect(result).toEqual({
      source: 'demo',
      stage: 'episode',
      url: 'https://demo.test/episode/a/',
      data: { video: 'https://cdn/x.mp4' },
    });
  });
});
