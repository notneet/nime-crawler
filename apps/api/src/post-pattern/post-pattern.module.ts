import { PostPattern } from '@libs/commons/entities/post-pattern.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostPatternController } from './post-pattern.controller';
import { PostPatternService } from './post-pattern.service';

@Module({
  imports: [TypeOrmModule.forFeature([PostPattern])],
  controllers: [PostPatternController],
  providers: [PostPatternService],
  exports: [PostPatternService],
})
export class PostPatternModule {}
