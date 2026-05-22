import { NormalizeUrlPipe } from './normalize-url.pipe';

describe('NormalizeUrlPipe', () => {
  const pipe = new NormalizeUrlPipe('https://otakudesu.blog');

  it('trims and keeps absolute urls', () => {
    expect(pipe.transform('  https://otakudesu.blog/anime/x/  ')).toBe(
      'https://otakudesu.blog/anime/x/',
    );
  });

  it('resolves a relative url against baseUrl', () => {
    expect(pipe.transform('/anime/x/')).toBe('https://otakudesu.blog/anime/x/');
  });

  it('throws on empty input', () => {
    expect(() => pipe.transform('   ')).toThrow();
  });
});
