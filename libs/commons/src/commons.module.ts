import { Module } from '@nestjs/common';
import { CommonsService } from './commons.service';
import { PrismaModule } from './prisma/prisma.module';
import { TypeormConfigModule } from './typeorm-config/typeorm-config.module';
import { HtmlScraperModule } from './html-scraper/html-scraper.module';
import { GdDownloaderModule } from './gd-downloader/gd-downloader.module';
import { SystemMonitorModule } from './system-monitor/system-monitor.module';
import { StringHelperModule } from './string-helper/string-helper.module';
import { ObscloudhostModule } from './obscloudhost/obscloudhost.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [PrismaModule, TypeormConfigModule, HtmlScraperModule, GdDownloaderModule, SystemMonitorModule, StringHelperModule, ObscloudhostModule],
})
export class CommonsModule {}
