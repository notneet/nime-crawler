import { AnimeSource } from '@entities/anime-source.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AnimeSourceRepository extends Repository<AnimeSource> {
  constructor(dataSource: DataSource) {
    super(AnimeSource, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof AnimeSource): Promise<AnimeSource[]> {
    return this.createQueryBuilder('anime_source')
      .groupBy(`anime_source.${fieldName}`)
      .getMany();
  }
}
