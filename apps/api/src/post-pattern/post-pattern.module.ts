import { Module } from '@nestjs/common';
import { PostPatternService } from './post-pattern.service';
import { PostPatternController } from './post-pattern.controller';
import { PrismaModule } from '@libs/commons/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PostPatternController],
  providers: [PostPatternService],
  exports: [PostPatternService],
})
export class PostPatternModule {}
