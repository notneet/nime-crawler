import { AnimeModel } from '@entities/anime_model.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AnimeModelRepository extends Repository<AnimeModel> {
  constructor(dataSource: DataSource) {
    super(AnimeModel, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof AnimeModel): Promise<AnimeModel[]> {
    return this.createQueryBuilder('anime_model')
      .groupBy(`anime_model.${fieldName}`)
      .getMany();
  }
}
