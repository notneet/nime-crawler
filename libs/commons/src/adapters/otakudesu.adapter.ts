import type { WorkflowAction } from '@hanivanrizky/nestjs-browser-action';
import type { SiteAdapter } from './site-adapter.types';

// Clicking a mirror <a data-content> POSTs the base64 payload to desustream and
// swaps #pembed iframe via ajax — the resolved stream URL only exists after the
// click. For each slot k (1..max) we: guard-click the kth <li> (nth-of-type skips
// the leading <span> label), wait for the ajax swap, then read the new iframe src
// into m{quality}url{k}. ifExists makes absent slots no-ops (no "not clickable").
function makeMirrorResolveActions(quality: number, max: number): WorkflowAction[] {
  const actions: WorkflowAction[] = [];
  for (let k = 1; k <= max; k++) {
    const anchor = `ul.m${quality}p li:nth-of-type(${k}) a`;
    actions.push(
      {
        action: 'click',
        target: { type: 'css', value: anchor },
        condition: { ifExists: { type: 'css', value: anchor } },
        onError: 'continue',
      },
      {
        action: 'wait',
        value: 2500,
        condition: { ifExists: { type: 'css', value: anchor } },
        onError: 'continue',
      },
      {
        id: `m${quality}url${k}`,
        action: 'extract',
        target: { type: 'css', value: '#pembed iframe' },
        options: { as: 'attribute', attribute: 'src' },
        condition: { ifExists: { type: 'css', value: anchor } },
        onError: 'continue',
      },
    );
  }
  return actions;
}

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
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Judul")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'titleJP',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Japanese")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'score',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Skor")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'type',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Tipe")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'status',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Status")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'totalEpisodes',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Total Episode")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'duration',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Durasi")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'releaseDate',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Tanggal Rilis")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'studio',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Studio")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'producers',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Produser")]]/text()'],
          pipes: { trim: true, custom: [{ type: 'regex', rules: [{ pattern: '^[:\\s]+', replacement: '' }] }] },
        },
        {
          key: 'thumbnailUrl',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="fotoanime"]/img/@src'],
          pipes: { trim: true },
        },
        {
          key: 'genres',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="infozingle"]//span[b[contains(.,"Genre")]]//a/text()'],
          meta: { multiple: true },
          pipes: { trim: true },
        },
        {
          key: 'synopsis',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[@class="sinopc"]//text()'],
          meta: { multiple: true },
          pipes: { trim: true, merge: 'with space' },
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
        // Static fields are extracted first (the mirror DOM is server-rendered
        // and unaffected by clicks). Then each 720p mirror is clicked to resolve
        // its real player URL (clicking POSTs the base64 data-content and swaps
        // the iframe via ajax — only then does the concrete stream URL exist).
        actions: [
          // Mirror clicks are trusted gestures that trip the page's popunder ad
          // script (it calls window.open to spawn shopee/affiliate tabs). Lock
          // window.open to a no-op up front so those tabs never open; pruneStrayPages
          // in EngineService stays as a backstop for anything that slips through.
          {
            id: 'neutralizeAds',
            action: 'evaluate',
            value:
              "() => { try { Object.defineProperty(window, 'open', { value: () => null, writable: false, configurable: false }); } catch { window.open = () => null; } }",
            onError: 'continue',
          },
          {
            id: 'title',
            action: 'extract',
            target: { type: 'css', value: 'h1.posttl' },
            options: { as: 'text' },
            onError: 'continue',
          },
          // "See All Episodes" points at the parent anime — the loose cross-stage link.
          {
            id: 'animeUrl',
            action: 'extract',
            target: { type: 'css', value: '.flir a[href*="/anime/"]' },
            options: { as: 'attribute', attribute: 'href' },
            onError: 'continue',
          },
          // Two spans: "Posted by <user>" and "Release on <time>". Split in the mapper.
          {
            id: 'kategoz',
            action: 'extract',
            target: { type: 'css', value: '.kategoz span' },
            options: { multiple: true, as: 'text' },
            onError: 'continue',
          },
          // Default player as it first loads — kept as the episode-level stream URL.
          {
            id: 'streamUrl',
            action: 'extract',
            target: { type: 'css', value: '#pembed iframe' },
            options: { as: 'attribute', attribute: 'src' },
            onError: 'continue',
          },
          // Labeled per-quality download files (quality/size/host grouped per row).
          // flat CSS can't group rows, so parse the static section in one evaluate.
          {
            id: 'downloads',
            action: 'evaluate',
            value:
              "() => Array.from(document.querySelectorAll('.download li')).map(li => ({ quality: (li.querySelector('strong')?.textContent || '').trim(), size: (li.querySelector('i')?.textContent || '').trim(), hosts: Array.from(li.querySelectorAll('a')).map(a => a.textContent.trim()), links: Array.from(li.querySelectorAll('a')).map(a => a.href) }))",
            onError: 'continue',
          },
          {
            id: 'mirror360Host',
            action: 'extract',
            target: { type: 'css', value: 'ul.m360p li a' },
            options: { multiple: true, as: 'text' },
            onError: 'continue',
          },
          {
            id: 'mirror360Payload',
            action: 'extract',
            target: { type: 'css', value: 'ul.m360p li a' },
            options: { multiple: true, as: 'attribute', attribute: 'data-content' },
            onError: 'continue',
          },
          {
            id: 'mirror480Host',
            action: 'extract',
            target: { type: 'css', value: 'ul.m480p li a' },
            options: { multiple: true, as: 'text' },
            onError: 'continue',
          },
          {
            id: 'mirror480Payload',
            action: 'extract',
            target: { type: 'css', value: 'ul.m480p li a' },
            options: { multiple: true, as: 'attribute', attribute: 'data-content' },
            onError: 'continue',
          },
          {
            id: 'mirror720Host',
            action: 'extract',
            target: { type: 'css', value: 'ul.m720p li a' },
            options: { multiple: true, as: 'text' },
            onError: 'continue',
          },
          {
            id: 'mirror720Payload',
            action: 'extract',
            target: { type: 'css', value: 'ul.m720p li a' },
            options: { multiple: true, as: 'attribute', attribute: 'data-content' },
            onError: 'continue',
          },
          // Mirror <li>s are hidden until the <ul> is clicked (jQuery slideToggle),
          // and clicking an <a> bubbles back to that toggle and re-hides them — so
          // direct clicks hit a display:none node ("not clickable"). Inject an
          // !important rule (beats jQuery's inline display:none) to force them
          // permanently visible before resolving.
          {
            id: 'revealMirrors',
            action: 'evaluate',
            value:
              "() => { const s = document.createElement('style'); s.textContent = '.mirrorstream li{display:list-item !important;visibility:visible !important}'; document.head.appendChild(s); }",
            onError: 'continue',
          },
          // Resolve each 720p mirror in order. nth-of-type counts only <li> (the
          // leading <span> label is skipped); ifExists guards absent slots.
          ...makeMirrorResolveActions(720, 6),
        ],
      },
    },
    batch: {
      engine: 'xpath',
      collect: 'downloads',
      patterns: [
        {
          key: 'row',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['//div[contains(@class,"batchlink")]//li'],
          meta: { isContainer: true },
        },
        {
          key: 'quality',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//strong/text()'],
          pipes: { trim: true },
        },
        {
          key: 'size',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//i/text()'],
          pipes: { trim: true },
        },
        {
          key: 'links',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//a/@href'],
          meta: { multiple: true },
        },
        {
          key: 'hosts',
          patternType: 'xpath',
          returnType: 'text',
          patterns: ['.//a/text()'],
          meta: { multiple: true },
          pipes: { trim: true },
        },
      ],
    },
  },
};
