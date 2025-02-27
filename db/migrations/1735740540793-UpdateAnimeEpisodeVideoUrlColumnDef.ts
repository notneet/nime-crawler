import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAnimeEpisodeVideoUrlColumnDef1735740540793 implements MigrationInterface {
    name = 'UpdateAnimeEpisodeVideoUrlColumnDef1735740540793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`video_url\` \`video_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`batch_url\` \`batch_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` DROP COLUMN \`download_list\``);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` ADD \`download_list\` json NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` DROP COLUMN \`download_list\``);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` ADD \`download_list\` longtext NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`batch_url\` \`batch_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`video_url\` \`video_url\` varchar(255) NOT NULL`);
    }

}
