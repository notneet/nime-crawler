import { Injectable, Logger } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';
import { BrowserActionService, PageService } from '@hanivanrizky/nestjs-browser-action';
import { StageConfig } from '../adapters/site-adapter.types';

@Injectable()
export class EngineService {
  private readonly logger = new Logger(EngineService.name);

  // BrowserActionService shares a single mutable PageService instance, so
  // concurrent scrapeWithWorkflow calls clobber each other's page (ERR_ABORTED).
  // Serialize browser scrapes through this chain; xpath stays concurrent.
  private browserChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly xpath: ScraperHtmlService,
    private readonly browser: BrowserActionService,
    private readonly pages: PageService,
  ) {}

  async parse(config: StageConfig, url: string): Promise<Record<string, unknown>> {
    if (config.engine === 'xpath') {
      if (!config.patterns?.length) {
        throw new Error('xpath stage requires patterns');
      }
      const res = await this.xpath.evaluateWebsite({ url, patterns: config.patterns });
      if (config.collect) return { [config.collect]: res.results };
      return res.results[0] ?? {};
    }

    if (!config.workflow) {
      throw new Error('browser stage requires a workflow');
    }
    const workflow = config.workflow;
    const res = await this.runBrowserExclusive(async () => {
      try {
        return await this.browser.scrapeWithWorkflow(url, workflow);
      } finally {
        await this.pruneStrayPages(url);
      }
    });
    return res.data;
  }

  // The pool manages browsers but never closes stray tabs. Mirror clicks spawn
  // popups (desustream players, ad redirects) that pile up in the one pooled
  // browser and eventually wedge it ("callFunctionOn timed out"). Close any tab
  // not on the job's host before the next payload runs; keep the working page so
  // the browser never drops to zero tabs (which would close it).
  private async pruneStrayPages(keepUrl: string): Promise<void> {
    const browser = this.pages.getCurrentBrowser();
    if (!browser) return;

    let keepHost: string;
    try {
      keepHost = new URL(keepUrl).host;
    } catch {
      return;
    }

    const current = this.pages.getCurrentPage();
    const open = await browser.pages();
    for (const page of open) {
      if (page === current) continue;
      let host = '';
      try {
        host = new URL(page.url()).host;
      } catch {
        host = '';
      }
      if (host === keepHost) continue;
      try {
        await page.close();
      } catch {
        this.logger.warn('failed to close stray page');
      }
    }
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
