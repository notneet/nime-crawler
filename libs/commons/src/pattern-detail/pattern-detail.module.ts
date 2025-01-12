import { PatternDetail } from '@entities/pattern-detail.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConnection } from '../constants';
import { PatternDetailRepository } from './pattern-detail.repository';
import { PatternDetailService } from './pattern-detail.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([PatternDetail]),
  ],
  providers: [PatternDetailService, PatternDetailRepository],
  exports: [PatternDetailService],
})
export class PatternDetailModule {}
