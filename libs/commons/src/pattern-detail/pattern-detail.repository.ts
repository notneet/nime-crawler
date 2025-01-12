import { PatternDetail } from '@entities/pattern-detail.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class PatternDetailRepository extends Repository<PatternDetail> {
  constructor(dataSource: DataSource) {
    super(PatternDetail, dataSource.createEntityManager());
  }

  async findAndGroupBy(
    fieldName: keyof PatternDetail,
  ): Promise<PatternDetail[]> {
    return this.createQueryBuilder('pattern_detail')
      .groupBy(`pattern_detail.${fieldName}`)
      .getMany();
  }
}
