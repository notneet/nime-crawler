import { PatternIndex } from '@entities/pattern-index.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PatternIndexRepository extends Repository<PatternIndex> {
  constructor(dataSource: DataSource) {
    super(PatternIndex, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof PatternIndex): Promise<PatternIndex[]> {
    return this.createQueryBuilder('pattern_index')
      .groupBy(`pattern_index.${fieldName}`)
      .getMany();
  }
}
