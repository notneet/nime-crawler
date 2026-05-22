import { Injectable } from '@nestjs/common';
import { ScraperHtmlService } from '@hanivanrizky/nestjs-xpath-parser';
import { BrowserActionService } from '@hanivanrizky/nestjs-browser-action';
import { StageConfig } from '../adapters/site-adapter.types';

@Injectable()
export class EngineService {
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
    const res = await this.browser.scrapeWithWorkflow(url, config.workflow);
    return res.data;
  }
}
