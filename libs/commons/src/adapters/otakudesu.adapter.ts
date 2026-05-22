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
          patterns: ['//div[contains(@class,"venz")]//a/@href'],
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
          {
            id: 'video',
            action: 'extract',
            target: { type: 'css', value: '#pembed iframe' },
            options: { as: 'attribute', attribute: 'src' },
          },
          {
            id: 'downloads',
            action: 'extract',
            target: { type: 'css', value: '.download a' },
            options: { multiple: true, as: 'attribute', attribute: 'href' },
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
