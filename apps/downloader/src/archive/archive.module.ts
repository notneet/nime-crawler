import { Module } from '@nestjs/common';
import { S3Module } from '@libs/commons/s3/s3.module';
import { ArchiveService } from './archive.service';
import { ArchiveConsumer } from './archive.consumer';

@Module({
  imports: [S3Module],
  providers: [ArchiveService, ArchiveConsumer],
  exports: [ArchiveService],
})
export class ArchiveModule {}
