import { Injectable, Logger } from '@nestjs/common';
import { BrowserManagerService } from '@hanivanrizky/nestjs-browser-action';

export interface ResolvedStream {
  url: string;
  headers: Record<string, string>;
}

const TIMEOUT_MS = 20_000;

@Injectable()
export class EmbedResolverService {
  private readonly logger = new Logger(EmbedResolverService.name);

  constructor(private readonly browserManager: BrowserManagerService) {}

  async resolve(embedUrl: string): Promise<ResolvedStream | null> {
    const { origin } = new URL(embedUrl);
    this.logger.log(`resolving embed url=${embedUrl}`);

    const browser = await this.browserManager.acquireBrowser();
    const page = await browser.newPage();
    try {
      return await new Promise<ResolvedStream | null>((resolve) => {
        const timer = setTimeout(() => {
          this.logger.warn(`embed resolve timeout url=${embedUrl}`);
          resolve(null);
        }, TIMEOUT_MS);

        page.on('response', (res) => {
          const url = res.url();
          if (!url.includes('.m3u8')) return;
          clearTimeout(timer);
          this.logger.log(`intercepted m3u8 url=${url}`);
          resolve({ url, headers: { Referer: origin + '/', Origin: origin } });
        });

        page.goto(embedUrl, { waitUntil: 'networkidle0', timeout: TIMEOUT_MS }).catch(() => {});
      });
    } finally {
      await Promise.race([page.close(), new Promise<void>(r => setTimeout(r, 2000))]).catch(() => {});
      this.browserManager.releaseBrowser(browser);
      this.logger.debug('browser released');
    }
  }
}
