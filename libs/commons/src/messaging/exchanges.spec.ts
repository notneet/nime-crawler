import { EXCHANGES, STAGES, routingKey, parseRoutingKey } from './exchanges';

describe('messaging/exchanges', () => {
  it('exposes durable exchange names', () => {
    expect(EXCHANGES.crawl).toBe('anime.crawl');
    expect(EXCHANGES.parsed).toBe('anime.parsed');
    expect(EXCHANGES.results).toBe('anime.results');
    expect(EXCHANGES.download).toBe('anime.download');
    expect(EXCHANGES.dlx).toBe('anime.crawl.dlx');
  });

  it('lists the four stages', () => {
    expect(STAGES).toEqual(['index', 'detail', 'episode', 'batch']);
  });

  it('builds a routing key from prefix, stage and site', () => {
    expect(routingKey('crawl', 'detail', 'otakudesu')).toBe('crawl.detail.otakudesu');
  });

  it('parses a routing key back into parts', () => {
    expect(parseRoutingKey('crawl.episode.otakudesu')).toEqual({
      prefix: 'crawl',
      stage: 'episode',
      site: 'otakudesu',
    });
  });
});
