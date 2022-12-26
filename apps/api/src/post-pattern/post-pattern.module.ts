import { Module } from '@nestjs/common';
import { PostPatternService } from './post-pattern.service';
import { PostPatternController } from './post-pattern.controller';

@Module({
  imports: [],
  controllers: [PostPatternController],
  providers: [PostPatternService],
  exports: [PostPatternService],
})
export class PostPatternModule {}
