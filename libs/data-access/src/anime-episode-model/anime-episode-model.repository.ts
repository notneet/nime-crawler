import { AnimeEpisodeModel } from '@entities/anime_episode_model.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class AnimeEpisodeModelRepository extends Repository<AnimeEpisodeModel> {
  constructor(dataSource: DataSource) {
    super(AnimeEpisodeModel, dataSource.createEntityManager());
  }

  async findAndGroupBy(
    fieldName: keyof AnimeEpisodeModel,
  ): Promise<AnimeEpisodeModel[]> {
    return this.createQueryBuilder('anime_episode_model')
      .groupBy(`anime_episode_model.${fieldName}`)
      .getMany();
  }
}
