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

const SYSTEM_PROMPT = `You are an expert web scraper. Given an HTML page and a reference stage config from a different anime site (otakudesu), produce a new stage config for the target site.

Rules:
- Output ONLY a single JSON object — no explanation, no markdown fences, no comments
- Match the reference structure exactly: same keys, same nesting, same field names
- Adapt all selectors (XPath, CSS, evaluate JS) to match the target site's actual HTML
- Preserve pipes, meta, discover, collect, engine, workflow structure from the reference
- For browser engine stages: keep the same action ids and sequence — only update CSS selectors and evaluate expressions to match the target page
- XPath patterns must be valid XPath 1.0 expressions targeting the actual HTML provided`;

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
    return this.truncate(html);
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
    return this.truncate(html);
  }

  private truncate(html: string): string {
    const stripped = html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    const result = stripped.slice(0, MAX_HTML_LENGTH);
    this.logger.debug(`truncate original=${html.length} stripped=${stripped.length} kept=${result.length}`);
    return result;
  }

  private buildMessages(stage: string, html: string, fetchMode: FetchMode = 'xpath'): Array<{ role: 'system' | 'user'; content: string }> {
    const refStage: StageConfig | undefined = otakudesuAdapter.stages[stage as Stage];
    const ref = refStage
      ? `REFERENCE (otakudesu ${stage} stage — match this structure exactly):\n${JSON.stringify(refStage, null, 2)}`
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
      : '';

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Stage: ${stage}${engineHint}\n\n${ref}\n\nTarget HTML:\n${html}` },
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
