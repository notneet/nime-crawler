import { PatternIndex } from '@entities/pattern-index.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConnection } from '../constants';
import { PatternIndexRepository } from './pattern-index.repository';
import { PatternIndexService } from './pattern-index.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([PatternIndex]),
  ],
  providers: [PatternIndexService, PatternIndexRepository],
  exports: [PatternIndexService],
})
export class PatternIndexModule {}
