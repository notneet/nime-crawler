import { Module } from '@nestjs/common';
import { PostPatternDetailService } from './post-pattern-detail.service';
import { PostPatternDetailController } from './post-pattern-detail.controller';
import { PrismaModule } from '@libs/commons/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostPatternDetailController],
  providers: [PostPatternDetailService],
  exports: [PostPatternDetailService],
})
export class PostPatternDetailModule {}
