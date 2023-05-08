import { Module } from '@nestjs/common';
import { GdDownloaderService } from './gd-downloader.service';

@Module({
  providers: [GdDownloaderService]
})
export class GdDownloaderModule {}
