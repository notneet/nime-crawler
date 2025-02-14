import { PatternWatch } from '@entities/pattern-watch.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PatternWatchRepository extends Repository<PatternWatch> {
  constructor(dataSource: DataSource) {
    super(PatternWatch, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof PatternWatch): Promise<PatternWatch[]> {
    return this.createQueryBuilder('pattern_watch')
      .groupBy(`pattern_watch.${fieldName}`)
      .getMany();
  }
}
