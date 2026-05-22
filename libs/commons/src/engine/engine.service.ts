import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';
import { BrowserActionService } from '@hanivanrizky/nestjs-browser-action';
import { StageConfig } from '../adapters/site-adapter.types';

@Injectable()
export class EngineService {
  // BrowserActionService shares a single mutable PageService instance, so
  // concurrent scrapeWithWorkflow calls clobber each other's page (ERR_ABORTED).
  // Serialize browser scrapes through this chain; xpath stays concurrent.
  private browserChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly xpath: ScraperHtmlService,
    private readonly browser: BrowserActionService,
  ) {}

  async parse(config: StageConfig, url: string): Promise<Record<string, unknown>> {
    if (config.engine === 'xpath') {
      if (!config.patterns?.length) {
        throw new Error('xpath stage requires patterns');
      }
      const res = await this.xpath.evaluateWebsite({ url, patterns: config.patterns });
      return res.results[0] ?? {};
    }

    if (!config.workflow) {
      throw new Error('browser stage requires a workflow');
    }
    const workflow = config.workflow;
    const res = await this.runBrowserExclusive(() =>
      this.browser.scrapeWithWorkflow(url, workflow),
    );
    return res.data;
  }

  private runBrowserExclusive<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.browserChain.then(fn, fn);
    this.browserChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
}
