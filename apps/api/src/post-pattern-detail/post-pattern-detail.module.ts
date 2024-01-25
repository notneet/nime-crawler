import { PostDetailPattern } from '@libs/commons/entities/post-detail-pattern.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostPatternDetailController } from './post-pattern-detail.controller';
import { PostPatternDetailService } from './post-pattern-detail.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostDetailPattern])],
  controllers: [PostPatternDetailController],
  providers: [PostPatternDetailService],
  exports: [PostPatternDetailService],
})
export class PostPatternDetailModule {}
