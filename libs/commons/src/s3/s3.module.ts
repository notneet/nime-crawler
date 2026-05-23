import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) =>
        new S3Client({
          endpoint: cfg.getOrThrow<string>('S3_ENDPOINT'),
          region: cfg.get<string>('S3_REGION') ?? 'us-east-1',
          credentials: {
            accessKeyId: cfg.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey: cfg.getOrThrow<string>('S3_SECRET_KEY'),
          },
          forcePathStyle: (cfg.get<string>('S3_FORCE_PATH_STYLE') ?? 'true') === 'true',
        }),
    },
    S3Service,
  ],
  exports: [S3Service],
})
export class S3Module {}
