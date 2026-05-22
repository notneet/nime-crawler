import { buildRabbitConfig } from './rabbit.config';

describe('buildRabbitConfig', () => {
  it('declares all four exchanges and connects to the given uri', () => {
    const cfg = buildRabbitConfig('amqp://guest:guest@localhost:5672');
    expect(cfg.uri).toBe('amqp://guest:guest@localhost:5672');
    const names = cfg.exchanges?.map((e) => e.name).sort();
    expect(names).toEqual(['anime.crawl', 'anime.crawl.dlx', 'anime.parsed', 'anime.results']);
    expect(cfg.exchanges?.every((e) => e.type === 'topic')).toBe(true);
    expect(cfg.connectionInitOptions).toEqual({ wait: false });
  });
});
