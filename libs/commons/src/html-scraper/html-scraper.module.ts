import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { Agent } from 'https';
import { SystemMonitorModule } from '../system-monitor/system-monitor.module';
import { HtmlScraperService } from './html-scraper.service';

@Module({
  imports: [
    HttpModule.register({
      httpsAgent: new Agent({ rejectUnauthorized: false }),
    }),
    SystemMonitorModule,
  ],
  providers: [HtmlScraperService],
  exports: [HtmlScraperService],
})
export class HtmlScraperModule {}
