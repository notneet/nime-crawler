import { Module } from '@nestjs/common';
import { PostPatternService } from './post-pattern.service';
import { PostPatternController } from './post-pattern.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostPattern } from '@libs/commons/entities/post-pattern.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostPattern])],
  controllers: [PostPatternController],
  providers: [PostPatternService],
  exports: [PostPatternService],
})
export class PostPatternModule {}
