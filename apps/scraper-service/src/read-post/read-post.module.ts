import { Module } from '@nestjs/common';
import { ReadPostController } from './read-post.controller';
import { ReadPostService } from './read-post.service';

/**
 * Bot ini bertugas untuk membaca post dari tiap anime/halaman info
 */

@Module({
  controllers: [ReadPostController],
  providers: [ReadPostService],
})
export class ReadPostModule {}
