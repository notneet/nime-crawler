import { AnimeEpisodeModel } from '@entities/anime_episode_model.entity';
import { AnimeLinkResultData } from '@entities/types/anime-link.interface';
import { Injectable, Logger } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { InsertResult, QueryRunner } from 'typeorm';
import { AnimeEpisodeModelRepository } from './anime-episode-model.repository';

@Injectable()
export class AnimeEpisodeModelService {
  private readonly logger = new Logger(AnimeEpisodeModelService.name);

  constructor(
    private readonly animeEpisodeModelRepo: AnimeEpisodeModelRepository,
  ) {}

  async storeData(
    data: Partial<AnimeEpisodeModel>,
    mediaId: bigint,
  ): Promise<InsertResult> {
    const queryRunner =
      this.animeEpisodeModelRepo.manager.connection.createQueryRunner();
    const tableName = `anime_episode_${mediaId?.toString()}`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const preparedData: Partial<AnimeEpisodeModel> = {
        ...data,
        video_url: data.video_url,
        mirrors: this.normalizeJSON<AnimeLinkResultData[]>(data.mirrors),
        download_list: this.normalizeJSON<AnimeLinkResultData[]>(
          data.download_list,
        ),
      };

      const res = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(preparedData)
        .orUpdate(
          ['video_url', 'mirrors', 'download_list', 'updated_at'],
          ['uuid', 'url'],
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

  async storeBulkData(data: Partial<AnimeEpisodeModel>[], mediaId: bigint) {
    const queryRunner =
      this.animeEpisodeModelRepo.manager.connection.createQueryRunner();
    const tableName = `anime_episode_${mediaId?.toString()}`;
    const now = new Date();

    const preparedData = data.map((item) => ({
      ...item,
      updated_at: now,
    }));

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First ensure the table exists
      await this.checkTableExists(queryRunner, tableName);

      // Perform bulk upsert
      const res = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(preparedData)
        .orUpdate(
          ['video_url', 'batch_url', 'download_list', 'updated_at'],
          ['anime_id'],
          {
            skipUpdateIfNoValuesChanged: true,
            upsertType: 'on-conflict-do-update',
          },
        )
        .execute();

      await queryRunner.commitTransaction();

      return res;
    } catch (err) {
      this.logger.error(`Failed to store bulk data: ${err.message}`);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findByAnimeId(
    id: bigint,
    mediaId: bigint,
  ): Promise<AnimeEpisodeModel | null> {
    if (isEmpty(id) || isEmpty(mediaId)) {
      return null;
    }

    const queryRunner =
      this.animeEpisodeModelRepo.manager.connection.createQueryRunner();
    const tableName = `anime_episode_${mediaId}`;

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .from(tableName, 'q')
        .select(`q.*`)
        .where('q.anime_id = :id', { id })
        .getRawOne<AnimeEpisodeModel>();

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
