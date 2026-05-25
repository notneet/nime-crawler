import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { OpenRouter } from '@openrouter/sdk';
import type { ChatFunctionTool, ChatMessages, ChatToolCall } from '@openrouter/sdk/models';
import { EngineService } from '@libs/commons/engine/engine.service';
import { otakudesuAdapter } from '@libs/commons/adapters/otakudesu.adapter';
import type { StageConfig } from '@libs/commons/adapters/site-adapter.types';
import type { Stage } from '@libs/commons/messaging/exchanges';

export type FetchMode = 'xpath' | 'browser';

type Provider = 'anthropic' | 'openrouter';

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    required?: string[];
    properties: Record<string, { type: string; description?: string; enum?: string[] }>;
  };
}

export interface AiResult {
  content: string | null;
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>;
}

const MAX_HTML_LENGTH = 40_000;

const KEEP_ATTRS = ['href', 'src', 'data-src', 'data-href', 'id', 'class', 'type', 'name', 'value'] as const;

const UTILITY_CLASS_RE =
  /^(?:m[trblxy]?|p[trblxy]?|[wh]|min-[wh]|max-[wh]|flex|grid|col|row|inline|block|hidden|visible|float|clear|text|font|bg|border|rounded|items|justify|content|gap|z|top|left|right|bottom|absolute|relative|fixed|sticky|overflow|cursor|pointer|select|transition|duration|ease|delay|opacity|shadow|ring|outline|space|divide|object|aspect|order|grow|shrink|basis|place|self|leading|tracking|decoration|uppercase|lowercase|capitalize|truncate|whitespace|break|list|table|caption|fill|stroke|sr|sm|md|lg|xl|2xl)-/;

const STAGE_KEY_HINTS: Readonly<Record<string, readonly string[]>> = {
  index:   ['links'],
  detail:  ['title', 'titleJP', 'score', 'type', 'status', 'genres', 'episodeLinks', 'batchLinks', 'thumbnailUrl'],
  episode: ['title', 'animeUrl', 'kategoz', 'streamUrl', 'downloadLabel', 'downloadHosts', 'downloadLinks', 'nextEpisode'],
  batch:   ['title', 'animeUrl', 'downloadLabel', 'downloadHosts', 'downloadLinks'],
} as const;

const STAGE_DISCOVER_HINTS: Readonly<Record<string, string>> = {
  index:   'discover: [{ stage: "detail", fromKey: "links" }]',
  detail:  'discover: [{ stage: "episode", fromKey: "episodeLinks" }, { stage: "batch", fromKey: "batchLinks" }] — omit rules whose fromKey was not extracted',
  episode: 'discover: [{ stage: "episode", fromKey: "nextEpisode" }] — only if nextEpisode was extracted',
  batch:   'discover: []',
} as const;

const VALID_STAGES = Object.keys(STAGE_KEY_HINTS).join(', ');

const SYSTEM_PROMPT = `You are an expert web scraper. Given an HTML page and a reference stage config from a different anime site (otakudesu), produce a new stage config for the target site.

Rules:
- Output ONLY a single JSON object — no explanation, no markdown fences, no comments
- Match the reference structure exactly: same keys, same nesting, same field names
- Adapt all selectors (XPath, CSS, evaluate JS) to match the target site's actual HTML
- Preserve pipes, meta, discover, collect, engine, workflow structure from the reference
- For browser engine stages: keep the same action ids and sequence — only update CSS selectors and evaluate expressions to match the target page
- XPath patterns must be valid XPath 1.0 expressions targeting the actual HTML provided
- Valid discover stage names are: ${VALID_STAGES} — never invent stage names outside this list
- XPath must NOT target <head> elements — the engine only parses the page body`;

@Injectable()
export class AiPatternService {
  private readonly logger = new Logger(AiPatternService.name);

  private readonly anthropic = new Anthropic({ apiKey: process.env['ANTHROPIC_API_KEY'] });
  private readonly openrouter = new OpenRouter({
    apiKey: process.env['OPENROUTER_API_KEY'],
    httpReferer: 'https://nime-dashboard',
    appTitle: 'nime-dashboard',
  });

  constructor(private readonly engine: EngineService) {}

  private get provider(): Provider {
    return process.env['AI_PROVIDER'] === 'openrouter' ? 'openrouter' : 'anthropic';
  }

  private get model(): string {
    return (
      process.env['AI_MODEL'] ??
      (this.provider === 'openrouter' ? 'openai/gpt-4o-mini' : 'claude-haiku-4-5-20251001')
    );
  }

  async fetchPageHtml(url: string, fetchMode: FetchMode): Promise<string> {
    this.logger.log(`fetchPageHtml url=${url} fetchMode=${fetchMode}`);
    return fetchMode === 'browser' ? this.fetchHtmlBrowser(url) : this.fetchHtmlXpath(url);
  }

  async suggest(html: string, stage: string, tools: ToolDefinition[] = [], fetchMode: FetchMode = 'xpath'): Promise<Record<string, unknown>> {
    this.logger.log(`suggest stage=${stage} fetchMode=${fetchMode} htmlLength=${html.length} provider=${this.provider} model=${this.model}`);
    const t0 = Date.now();
    const messages = this.buildMessages(stage, html, fetchMode);
    const result = this.provider === 'openrouter'
      ? await this.callOpenRouter(messages, tools)
      : await this.callAnthropic(messages);

    if (result.toolCalls.length > 0) {
      this.logger.debug(`tool calls=${result.toolCalls.map((tc) => tc.name).join(',')}`);
    }

    const stage_config = this.parseStage(result.content ?? '');
    this.logger.log(`done ms=${Date.now() - t0}`);
    return stage_config;
  }

  private async fetchHtmlXpath(url: string): Promise<string> {
    this.logger.debug(`fetch xpath url=${url}`);
    let res: Record<string, unknown>;
    try {
      res = await this.engine.parse(
        {
          engine: 'xpath',
          patterns: [{ key: 'html', patternType: 'xpath', returnType: 'rawHTML', patterns: ['/html'] }],
        },
        url,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const is403 = msg.includes('403') || msg.includes('Forbidden');
      const is429 = msg.includes('429') || msg.includes('Too Many');
      const hint = is403 || is429
        ? 'Site blocked the request (bot protection / Cloudflare). Switch "Load via" to browser.'
        : `Fetch failed: ${msg}`;
      throw new InternalServerErrorException(hint);
    }
    const html = res['html'];
    if (typeof html !== 'string' || !html) {
      throw new InternalServerErrorException(`xpath fetch returned no HTML for ${url}`);
    }
    return this.normalizeHtml(html);
  }

  private async fetchHtmlBrowser(url: string): Promise<string> {
    this.logger.debug(`fetch browser url=${url}`);
    const res = await this.engine.parse(
      {
        engine: 'browser',
        workflow: {
          version: '1.0',
          actions: [
            { id: 'html', action: 'evaluate', value: '() => document.documentElement.outerHTML', onError: 'continue' },
          ],
        },
      },
      url,
    );
    const html = res['html'];
    if (typeof html !== 'string' || !html) {
      throw new InternalServerErrorException(`browser fetch returned no HTML for ${url}`);
    }
    return this.normalizeHtml(html);
  }

  private filterClasses(val: string): string {
    return val.split(/\s+/).filter(c => c && !UTILITY_CLASS_RE.test(c)).join(' ');
  }

  private normalizeHtml(html: string): string {
    const stripped = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');

    const normalized = stripped.replace(
      /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?(\/?)>/g,
      (_match: string, tag: string, attrsRaw: string | undefined, slash: string) => {
        if (!attrsRaw) return `<${tag}${slash}>`;
        const parts: string[] = [];
        for (const attr of KEEP_ATTRS) {
          const m = attrsRaw.match(new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>/"']+))`, 'i'));
          if (!m) continue;
          const val = (m[1] ?? m[2] ?? m[3] ?? '').trim();
          if (!val) continue;
          if (attr === 'class') {
            const filtered = this.filterClasses(val);
            if (filtered) parts.push(`class="${filtered}"`);
          } else {
            parts.push(`${attr}="${val}"`);
          }
        }
        const attrStr = parts.length ? ' ' + parts.join(' ') : '';
        return `<${tag}${attrStr}${slash}>`;
      },
    );

    const collapsed = normalized.replace(/\s+/g, ' ').trim();
    const result = collapsed.slice(0, MAX_HTML_LENGTH);
    this.logger.debug(`normalizeHtml original=${html.length} normalized=${collapsed.length} kept=${result.length}`);
    return result;
  }

  private buildMessages(stage: string, html: string, fetchMode: FetchMode = 'xpath'): Array<{ role: 'system' | 'user'; content: string }> {
    let refStage: StageConfig | undefined = otakudesuAdapter.stages[stage as Stage];
    // When fetchMode is xpath but the reference stage is browser-only, substitute
    // a xpath-based stage so the AI sees the correct patterns[] structure.
    if (fetchMode === 'xpath' && refStage?.engine === 'browser') {
      refStage = otakudesuAdapter.stages['detail' as Stage] ?? otakudesuAdapter.stages['index' as Stage];
    }
    const ref = refStage
      ? `REFERENCE (otakudesu — match this structure exactly):\n${JSON.stringify(refStage, null, 2)}`
      : `No reference available for stage "${stage}". Produce a sensible StageConfig JSON object.`;
    const engineHint = fetchMode === 'browser'
      ? `\nIMPORTANT: The target site requires a browser engine. Use "engine": "browser". The workflow MUST use this exact structure:
{
  "engine": "browser",
  "workflow": {
    "version": "1.0",
    "actions": [
      {
        "id": "<resultKey>",
        "action": "extract",
        "target": { "type": "css", "value": "<CSS selector>" },
        "options": { "multiple": true, "as": "attribute", "attribute": "href" },
        "onError": "continue"
      }
    ]
  },
  "discover": [{ "stage": "<nextStage>", "fromKey": "<resultKey>" }]
}
Use "action": "extract" with CSS selectors for simple data. Use "action": "evaluate" with "value": "() => ..." for complex JS. Each action's "id" becomes the result key. Do NOT use xpath patterns, pipes, or any other structure.`
      : `\nIMPORTANT: The target site is fetched via plain HTTP (xpath engine). Use "engine": "xpath". Do NOT use "engine": "browser" or any workflow/actions structure — even if the reference uses browser engine. Use xpath patterns and pipes structure only.`;

    const keyHints = STAGE_KEY_HINTS[stage];
    const discoverHint = STAGE_DISCOVER_HINTS[stage];
    const keyNote = keyHints
      ? `\nPREFERRED KEY NAMES for "${stage}" stage: ${keyHints.join(', ')} — use these exact names where applicable.` +
        (discoverHint ? `\nDISCOVER RULE for "${stage}" stage: ${discoverHint}` : '') +
        `\nIMPORTANT: For "animeUrl" — breadcrumbs often contain multiple /anime/ links (e.g. a generic /anime/ index AND the specific /anime/slug/ link). Always use [last()] or a condition to target the specific one, not the generic index link.`
      : '';

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Stage: ${stage}${engineHint}${keyNote}\n\n${ref}\n\nTarget HTML:\n${html}` },
    ];
  }

  private async callAnthropic(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
  ): Promise<AiResult> {
    this.logger.debug(`anthropic request model=${this.model}`);
    const [system, ...rest] = messages;
    const msg = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 4_096,
      system: system?.content,
      messages: rest.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    });
    this.logger.debug(`anthropic response stop_reason=${msg.stop_reason} in=${msg.usage.input_tokens} out=${msg.usage.output_tokens}`);
    const block = msg.content[0];
    return { content: block?.type === 'text' ? block.text : null, toolCalls: [] };
  }

  private async callOpenRouter(
    messages: Array<{ role: 'system' | 'user'; content: string }>,
    tools: ToolDefinition[] = [],
  ): Promise<AiResult> {
    this.logger.debug(`openrouter request model=${this.model} tools=${tools.length}`);

    const sdkMessages: ChatMessages[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const sdkTools: ChatFunctionTool[] = tools.map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters as Record<string, unknown>,
      },
    }));

    const result = await this.openrouter.chat.send({
      chatRequest: {
        model: this.model,
        maxTokens: 4_096,
        messages: sdkMessages,
        ...(sdkTools.length > 0 && { tools: sdkTools, toolChoice: 'auto' }),
        stream: false,
      },
    });

    this.logger.debug(`openrouter response in=${result.usage?.promptTokens} out=${result.usage?.completionTokens}`);

    const msg = result.choices[0]?.message;
    const toolCalls = this.parseToolCalls(msg?.toolCalls ?? []);

    return { content: msg?.content ?? null, toolCalls };
  }

  private parseToolCalls(raw: ChatToolCall[]): AiResult['toolCalls'] {
    return raw.map((tc) => ({
      name: tc.function.name,
      arguments: (() => { try { return JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { return {}; } })(),
    }));
  }

  private parseStage(raw: string): Record<string, unknown> {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      this.logger.warn(`parseStage: no JSON object in response raw=${raw.slice(0, 200)}`);
      throw new InternalServerErrorException('AI did not return a JSON object');
    }
    return JSON.parse(match[0]) as Record<string, unknown>;
  }
}
