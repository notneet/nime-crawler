import { PatternIndex } from '@entities/pattern-index.entity';
import { PatternData } from '@entities/types/pattern-data.type';
import { Injectable } from '@nestjs/common';
import { PatternIndexRepository } from './pattern-index.repository';

@Injectable()
export class PatternIndexService {
  constructor(private readonly patternIndexRepo: PatternIndexRepository) {}

  async findAll(): Promise<PatternIndex[]> {
    return this.patternIndexRepo.find();
  }

  parsePattern(pattern: string): PatternData {
    return JSON.parse(pattern);
  }
}
