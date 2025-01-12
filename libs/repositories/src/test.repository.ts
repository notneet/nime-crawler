import { Test } from '@entities/test.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class TestRepository extends Repository<Test> {
  constructor(dataSource: DataSource) {
    super(Test, dataSource?.createEntityManager());
  }

  async findAllRow() {
    return await this.find();
  }
}
