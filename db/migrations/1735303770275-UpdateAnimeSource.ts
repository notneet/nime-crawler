import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAnimeSource1735303770275 implements MigrationInterface {
    name = 'UpdateAnimeSource1735303770275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`updated_at\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`created_at\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
    }

}
