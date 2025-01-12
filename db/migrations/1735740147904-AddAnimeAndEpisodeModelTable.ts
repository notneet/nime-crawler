import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAnimeAndEpisodeModelTable1735740147904 implements MigrationInterface {
    name = 'AddAnimeAndEpisodeModelTable1735740147904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`anime_model\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`title_en\` varchar(255) NOT NULL, \`title_jp\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`image_url\` varchar(255) NOT NULL, \`producers\` varchar(255) NOT NULL, \`studios\` varchar(255) NOT NULL, \`genres\` varchar(255) NOT NULL, \`episode_count\` int NOT NULL, \`episode_duration\` int NOT NULL, \`rating\` decimal(3,2) NOT NULL, \`release_date\` timestamp NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_0045073e0b1357fe1f8658710c\` (\`url\`), INDEX \`IDX_1667f8f1e9a25648df9f5953f9\` (\`title_en\`), INDEX \`IDX_9d54c0b2cb664778b2826fe9d6\` (\`title_jp\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`anime_episode_model\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`anime_id\` bigint UNSIGNED NOT NULL, \`video_url\` varchar(255) NOT NULL, \`batch_url\` varchar(255) NOT NULL, \`download_list\` json NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX \`IDX_a0d6e4e78c2b4fe466e9e35a4e\` (\`anime_id\`), INDEX \`IDX_088e656bb6f7f1ae0c4db6008c\` (\`video_url\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_088e656bb6f7f1ae0c4db6008c\` ON \`anime_episode_model\``);
        await queryRunner.query(`DROP INDEX \`IDX_a0d6e4e78c2b4fe466e9e35a4e\` ON \`anime_episode_model\``);
        await queryRunner.query(`DROP TABLE \`anime_episode_model\``);
        await queryRunner.query(`DROP INDEX \`IDX_9d54c0b2cb664778b2826fe9d6\` ON \`anime_model\``);
        await queryRunner.query(`DROP INDEX \`IDX_1667f8f1e9a25648df9f5953f9\` ON \`anime_model\``);
        await queryRunner.query(`DROP INDEX \`IDX_0045073e0b1357fe1f8658710c\` ON \`anime_model\``);
        await queryRunner.query(`DROP TABLE \`anime_model\``);
    }

}
