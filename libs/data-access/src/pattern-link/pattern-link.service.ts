import { PatternLink } from '@entities/pattern-link.entity';
import { PatternData } from '@entities/types/pattern-data.type';
import { Injectable } from '@nestjs/common';
import { PatternLinkRepository } from './pattern-link.repository';

@Injectable()
export class PatternLinkService {
  constructor(private readonly patternLinkRepo: PatternLinkRepository) {}

  async findAll(): Promise<PatternLink[]> {
    return this.patternLinkRepo.find();
  }

  parsePattern(pattern: string): PatternData {
    return JSON.parse(pattern);
  }
}
