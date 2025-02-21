import { AnimeModel } from '@entities/anime_model.entity';
import { AnimeLinkResultData } from '@entities/types/anime-link.interface';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { InsertResult, QueryRunner } from 'typeorm';
import { AnimeModelRepository } from './anime-model.repository';

@Injectable()
export class AnimeModelService {
  private readonly logger = new Logger(AnimeModelService.name);

  constructor(private readonly animeModelRepo: AnimeModelRepository) {}

  async storeData(
    data: Partial<AnimeModel>,
    mediaId: bigint,
  ): Promise<InsertResult> {
    const queryRunner =
      this.animeModelRepo.manager.connection.createQueryRunner();
    const tableName = `anime_${mediaId?.toString()}`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const preparedData: Partial<AnimeModel> = {
        ...data,
        batch_download_list: this.normalizeJSON<AnimeLinkResultData[]>(
          data.batch_download_list,
        ),
      };

      const res = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(preparedData)
        .orUpdate(
          [
            'title_en',
            'title_jp',
            'description',
            'image_url',
            'producers',
            'studios',
            'genres',
            'episode_count',
            'episode_duration',
            'rating',
            'release_date',
            'batch_download_list',
            'updated_at',
          ],
          ['url', 'uuid'],
          {
            skipUpdateIfNoValuesChanged: true,
            upsertType: 'on-conflict-do-update',
          },
        )
        .execute();

      await queryRunner.commitTransaction();

      return res;
    } catch (err) {
      this.logger.error(`Failed to store data: ${err.message}`);
      await queryRunner.rollbackTransaction();

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByUUID(uuid: string): Promise<AnimeModel> {
    return this.animeModelRepo.findOneBy({ uuid });
  }

  async findById(id: bigint, mediaId: bigint): Promise<AnimeModel | null> {
    if (isEmpty(id) || isEmpty(mediaId)) {
      return null;
    }

    const queryRunner =
      this.animeModelRepo.manager.connection.createQueryRunner();
    const tableName = `anime_${mediaId}`;

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .from(tableName, 'q')
        .select(`q.*`)
        .where('q.id = :id', { id })
        .getRawOne<AnimeModel>();

      return res;
    } catch (error) {
      this.logger.error(
        `Failed to find record with id ${id} in table ${tableName}: ${error.message}`,
      );
      throw error;
    }
  }

  private normalizeJSON<T>(jsonString: T): T {
    return JSON.stringify(jsonString) as unknown as T;
  }

  private async checkTableExists(queryRunner: QueryRunner, tableName: string) {
    const tableExists = await queryRunner.hasTable(tableName);

    if (!tableExists) {
      this.logger.error(`Table ${tableName} does not exist`);
      throw new Error(`Table ${tableName} does not exist`);
    }
  }
}
