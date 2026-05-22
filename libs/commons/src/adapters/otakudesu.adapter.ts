import type { SiteAdapter } from './site-adapter.types';

// Selectors are best-effort from the live site structure. Validate against
// captured HTML fixtures before relying on them in production. Link-list
// patterns set meta.multiple so they return arrays (job-builder expects arrays).
export const otakudesuAdapter: SiteAdapter = {
  source: 'otakudesu',
  baseUrl: 'https://otakudesu.blog',
  enabled: true,
  stages: {
    index: {
      engine: 'xpath',
      patterns: [
        {
          key: 'links',
          patternType: 'xpath',
          returnType: 'text',
          // First .venz block is the On-going list; the Complete list is a
          // second .venz nested further down. Scope to the first and to
          // /anime/ hrefs so section-header links are excluded.
          patterns: ["(//div[contains(@class,'venz')])[1]//a[contains(@href,'/anime/')]/@href"],
          meta: { multiple: true },
        },
      ],
      discover: [{ stage: 'detail', fromKey: 'links' }],
    },
    detail: {
      engine: 'xpath',
      patterns: [
        {
          key: 'title',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="jdlrx"]/h1/text()'],
          pipes: { trim: true },
        },
        {
          key: 'episodeLinks',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="episodelist"]//a[contains(@href,"/episode/")]/@href'],
          meta: { multiple: true },
        },
        {
          key: 'batchLinks',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="episodelist"]//a[contains(@href,"/batch/")]/@href'],
          meta: { multiple: true },
        },
      ],
      discover: [
        { stage: 'episode', fromKey: 'episodeLinks' },
        { stage: 'batch', fromKey: 'batchLinks' },
      ],
    },
    episode: {
      engine: 'browser',
      workflow: {
        version: '1.0',
        actions: [
          // Capture the stream that loads by default, kept as `videoFallback`
          // in case the higher-res mirror selection below fails.
          {
            id: 'videoFallback',
            action: 'extract',
            target: { type: 'css', value: '#pembed iframe' },
            options: { as: 'attribute', attribute: 'src' },
            onError: 'continue',
          },
          // Select the highest available resolution (720p), first mirror.
          // Clicking swaps the player iframe via JS; if no 720p mirror exists
          // the click is skipped and the default stream stands.
          {
            id: 'selectHd',
            action: 'click',
            target: { type: 'css', value: 'ul.m720p li a' },
            onError: 'continue',
          },
          // Wait for the swapped iframe to finish loading the new source.
          {
            id: 'awaitVideo',
            action: 'wait',
            options: { delay: 3000 },
            onError: 'continue',
          },
          // Preferred stream after HD selection; falls back to videoFallback
          // downstream when this is empty/unchanged.
          {
            id: 'video',
            action: 'extract',
            target: { type: 'css', value: '#pembed iframe' },
            options: { as: 'attribute', attribute: 'src' },
            onError: 'continue',
          },
          {
            id: 'downloads',
            action: 'extract',
            target: { type: 'css', value: '.download a' },
            options: { multiple: true, as: 'attribute', attribute: 'href' },
            onError: 'continue',
          },
        ],
      },
    },
    batch: {
      engine: 'xpath',
      patterns: [
        {
          key: 'downloads',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="download"]//a/@href'],
          meta: { multiple: true },
        },
      ],
    },
  },
};
