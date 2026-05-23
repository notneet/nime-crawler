import { parseQualityRank, pickMaxMin } from './quality';

describe('parseQualityRank', () => {
  it.each([
    ['1080p', 1080], ['720P', 720], ['480', 480], ['HD 1080p', 1080],
    ['4K', null], ['unknown', null], ['', null],
  ])('parses %s', (s, expected) => {
    expect(parseQualityRank(s as string)).toBe(expected);
  });
});

describe('pickMaxMin', () => {
  it('picks single when only one quality', () => {
    const rows = [{ id: 1, quality: '720p' }];
    const r = pickMaxMin(rows, (x) => parseQualityRank(x.quality));
    expect(r).toEqual([rows[0]]);
  });
  it('picks max and min when many', () => {
    const rows = [{ q: '480p' }, { q: '1080p' }, { q: '720p' }];
    const r = pickMaxMin(rows, (x) => parseQualityRank(x.q));
    expect(r.map((x) => x.q)).toEqual(['1080p', '480p']);
  });
  it('drops unparseable', () => {
    const rows = [{ q: 'huh' }, { q: '720p' }];
    const r = pickMaxMin(rows, (x) => parseQualityRank(x.q));
    expect(r.map((x) => x.q)).toEqual(['720p']);
  });
  it('returns [] when all unparseable', () => {
    expect(pickMaxMin([{ q: 'a' }], (x) => parseQualityRank(x.q))).toEqual([]);
  });
});
