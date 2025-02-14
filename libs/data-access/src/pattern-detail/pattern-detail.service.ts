import { PatternDetail } from '@entities/pattern-detail.entity';
import { PatternData } from '@entities/types/pattern-data.type';
import { Injectable } from '@nestjs/common';
import { PatternDetailRepository } from './pattern-detail.repository';

@Injectable()
export class PatternDetailService {
  constructor(private readonly patternDetailRepo: PatternDetailRepository) {}

  async findAll(): Promise<PatternDetail[]> {
    return this.patternDetailRepo.find();
  }

  parsePattern(pattern: string): PatternData {
    return JSON.parse(pattern);
  }
}
