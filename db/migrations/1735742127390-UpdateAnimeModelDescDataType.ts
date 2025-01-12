import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAnimeModelDescDataType1735742127390 implements MigrationInterface {
    name = 'UpdateAnimeModelDescDataType1735742127390'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`title_jp\` \`title_jp\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`anime_model\` ADD \`description\` longtext NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`producers\` \`producers\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`studios\` \`studios\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`genres\` \`genres\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_count\` \`episode_count\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_duration\` \`episode_duration\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`rating\` \`rating\` decimal(3,2) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`release_date\` \`release_date\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`release_date\` \`release_date\` timestamp NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`rating\` \`rating\` decimal(3,2) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_duration\` \`episode_duration\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_count\` \`episode_count\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`genres\` \`genres\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`studios\` \`studios\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`producers\` \`producers\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` DROP COLUMN \`description\``);
        await queryRunner.query(`ALTER TABLE \`anime_model\` ADD \`description\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`title_jp\` \`title_jp\` varchar(255) NULL DEFAULT 'NULL'`);
    }

}
