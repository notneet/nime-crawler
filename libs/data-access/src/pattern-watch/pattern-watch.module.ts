import { PatternWatch } from '@entities/pattern-watch.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConnection } from '../../../commons/src/constants';
import { PatternWatchRepository } from './pattern-watch.repository';
import { PatternWatchService } from './pattern-watch.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([PatternWatch]),
  ],
  providers: [PatternWatchService, PatternWatchRepository],
  exports: [PatternWatchService],
})
export class PatternWatchModule {}
