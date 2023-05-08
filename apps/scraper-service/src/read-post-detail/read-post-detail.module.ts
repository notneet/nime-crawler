import { Module } from '@nestjs/common';
import { ReadPostDetailController } from './read-post-detail.controller';
import { ReadPostDetailService } from './read-post-detail.service';

/**
 * Bot ini bertugas membaca post detail dari anime/halaman episode&streams
 */

@Module({
  controllers: [ReadPostDetailController],
  providers: [ReadPostDetailService],
})
export class ReadPostDetailModule {}
