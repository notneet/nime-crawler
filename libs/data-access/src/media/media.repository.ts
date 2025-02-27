import { Media } from '@entities/media.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class MediaRepository extends Repository<Media> {
  constructor(dataSource: DataSource) {
    super(Media, dataSource.createEntityManager());
  }

  async findAndGroupBy(fieldName: keyof Media): Promise<Media[]> {
    return this.createQueryBuilder('media')
      .groupBy(`media.${fieldName}`)
      .getMany();
  }
}
