import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAnimeAndEpisodeModelColumnDef1735740363603 implements MigrationInterface {
    name = 'UpdateAnimeAndEpisodeModelColumnDef1735740363603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`title_jp\` \`title_jp\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`description\` \`description\` varchar(255) NULL`);
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
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` ADD \`download_list\` longtext COLLATE "utf8mb4_bin" NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_episode_model\` CHANGE \`batch_url\` \`batch_url\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`release_date\` \`release_date\` timestamp NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`rating\` \`rating\` decimal(3,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_duration\` \`episode_duration\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`episode_count\` \`episode_count\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`genres\` \`genres\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`studios\` \`studios\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`producers\` \`producers\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`image_url\` \`image_url\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`description\` \`description\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_model\` CHANGE \`title_jp\` \`title_jp\` varchar(255) NOT NULL`);
    }

}
