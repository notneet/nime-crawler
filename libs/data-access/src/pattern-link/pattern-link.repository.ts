import { PatternLink } from '@entities/pattern-link.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PatternLinkRepository extends Repository<PatternLink> {
  constructor(dataSource: DataSource) {
    super(PatternLink, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof PatternLink): Promise<PatternLink[]> {
    return this.createQueryBuilder('pattern_link')
      .groupBy(`pattern_link.${fieldName}`)
      .getMany();
  }
}
