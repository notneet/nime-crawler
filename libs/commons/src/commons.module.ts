import { Module } from '@nestjs/common';
import { CommonsService } from './commons.service';
import { PrismaModule } from './prisma/prisma.module';
import { TypeormConfigModule } from './typeorm-config/typeorm-config.module';
import { HtmlScraperModule } from './html-scraper/html-scraper.module';
import { GdDownloaderModule } from './gd-downloader/gd-downloader.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [PrismaModule, TypeormConfigModule, HtmlScraperModule, GdDownloaderModule],
})
export class CommonsModule {}
