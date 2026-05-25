import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BrowserActionModule } from '@hanivanrizky/nestjs-browser-action';
import { S3Module } from '@libs/commons/s3/s3.module';
import { ArchiveService } from './archive.service';
import { EmbedResolverService } from './embed-resolver.service';

@Module({
  imports: [
    S3Module,
    BrowserActionModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        pool: { min: 1, max: 2 },
        cookies: { enabled: false },
        launchOptions: {
          headless: cfg.get<string>('BROWSER_HEADLESS') !== 'false',
          protocolTimeout: 30_000,
        },
      }),
    }),
  ],
  providers: [ArchiveService, EmbedResolverService],
  exports: [ArchiveService],
})
export class ArchiveModule {}
