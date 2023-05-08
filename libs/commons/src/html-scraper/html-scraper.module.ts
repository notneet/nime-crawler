import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Agent } from 'https';
import { HtmlScraperService } from './html-scraper.service';

@Module({
  imports: [
    HttpModule.register({
      httpsAgent: new Agent({ rejectUnauthorized: false }),
    }),
  ],
  providers: [HtmlScraperService],
  exports: [HtmlScraperService],
})
export class HtmlScraperModule {}
