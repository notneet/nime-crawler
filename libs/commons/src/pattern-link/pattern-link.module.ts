import { dbConnection } from '@commons/constants';
import { PatternLink } from '@entities/pattern-link.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatternLinkRepository } from './pattern-link.repository';
import { PatternLinkService } from './pattern-link.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([PatternLink]),
  ],
  providers: [PatternLinkService, PatternLinkRepository],
  exports: [PatternLinkService],
})
export class PatternLinkModule {}
