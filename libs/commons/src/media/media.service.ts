import { Media } from '@entities/media.entity';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { isEmpty } from 'class-validator';
import { InsertResult, QueryRunner, UpdateResult } from 'typeorm';
import { MediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly mediaRepo: MediaRepository) {}

  async findAll(): Promise<Media[]> {
    return this.mediaRepo.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: bigint): Promise<Media> {
    const media = await this.mediaRepo.findOneBy({ id });

    if (isEmpty(media)) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return media;
  }

  async create(data: Partial<Media>): Promise<InsertResult> {
    const queryRunner = this.mediaRepo.manager.connection.createQueryRunner();
    const tableName = `media`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into(tableName)
        .values(data)
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

  async update(id: bigint, data: Partial<Media>): Promise<UpdateResult> {
    const queryRunner = this.mediaRepo.manager.connection.createQueryRunner();
    const tableName = `media`;

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkTableExists(queryRunner, tableName);

      const res = await queryRunner.manager
        .createQueryBuilder()
        .update(tableName)
        .set(data)
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
