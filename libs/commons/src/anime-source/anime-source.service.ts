import { AnimeSource } from '@entities/anime-source.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InsertResult, QueryRunner, UpdateResult } from 'typeorm';
import { AnimeSourceRepository } from './anime-source.repository';

@Injectable()
export class AnimeSourceService {
  private readonly logger = new Logger(AnimeSourceService.name);

  constructor(private readonly animeSourceRepo: AnimeSourceRepository) {}

  async findGrouped(): Promise<AnimeSource[]> {
    return this.animeSourceRepo.findAndGroupBy('last_run_at');
  }

  async findAll(): Promise<AnimeSource[]> {
    return this.animeSourceRepo.find({ order: { created_at: 'DESC' } });
  }

  async create(createSourceDto: Partial<AnimeSource>): Promise<InsertResult> {
    const queryRunner =
      this.animeSourceRepo.manager.connection.createQueryRunner();
    const tableName = `anime_source`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(createSourceDto)
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

  async update(
    id: bigint,
    updateSourceDto: Partial<AnimeSource>,
  ): Promise<UpdateResult> {
    const queryRunner =
      this.animeSourceRepo.manager.connection.createQueryRunner();
    const tableName = `anime_source`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .update(tableName)
        .set(updateSourceDto)
        .where('id = :id', { id })
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

  private async checkTableExists(queryRunner: QueryRunner, tableName: string) {
    const tableExists = await queryRunner.hasTable(tableName);

    if (!tableExists) {
      this.logger.error(`Table ${tableName} does not exist`);
      throw new Error(`Table ${tableName} does not exist`);
    }
  }
}
