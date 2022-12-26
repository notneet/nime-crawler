import { Module } from '@nestjs/common';
import { PostPatternDetailService } from './post-pattern-detail.service';
import { PostPatternDetailController } from './post-pattern-detail.controller';

@Module({
  imports: [],
  controllers: [PostPatternDetailController],
  providers: [PostPatternDetailService],
  exports: [PostPatternDetailService],
})
export class PostPatternDetailModule {}
