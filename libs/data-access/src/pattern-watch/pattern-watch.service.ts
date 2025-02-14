import { PatternWatch } from '@entities/pattern-watch.entity';
import { PatternData } from '@entities/types/pattern-data.type';
import { Injectable } from '@nestjs/common';
import { PatternWatchRepository } from './pattern-watch.repository';

@Injectable()
export class PatternWatchService {
  constructor(private readonly patternWatchRepo: PatternWatchRepository) {}

  async findAll(): Promise<PatternWatch[]> {
    return this.patternWatchRepo.find();
  }

  parsePattern(pattern: string): PatternData {
    return JSON.parse(pattern);
  }
}
