import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1749050264134 implements MigrationInterface {
    name = 'InitTables1749050264134'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sources\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`slug\` varchar(50) NOT NULL, \`base_url\` text NOT NULL, \`selectors\` json NULL, \`headers\` json NULL, \`priority\` smallint NOT NULL DEFAULT '1', \`is_active\` tinyint NOT NULL DEFAULT 1, \`delay_ms\` int NOT NULL DEFAULT '5000', \`last_crawled_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_9a5cea873a16f3b91692a889d1\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`source_health\` (\`id\` int NOT NULL AUTO_INCREMENT, \`source_id\` int NOT NULL, \`is_accessible\` tinyint NOT NULL, \`response_time_ms\` int NULL, \`http_status_code\` int NULL, \`error_message\` text NULL, \`success_rate_24h\` int NOT NULL DEFAULT '0', \`checked_at\` timestamp NOT NULL, INDEX \`IDX_8ce120d8fb709de4d10530bcbe\` (\`checked_at\`), INDEX \`IDX_f287ed7b8766e711115e8d846f\` (\`source_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cache_entries\` (\`id\` int NOT NULL AUTO_INCREMENT, \`cache_key\` varchar(255) NOT NULL, \`cache_value\` longtext NOT NULL, \`expires_at\` timestamp NOT NULL, \`hit_count\` int NOT NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_727122153244e584c366996a3e\` (\`created_at\`), INDEX \`IDX_4ee5bb647af323bfa4b64b9f45\` (\`expires_at\`), UNIQUE INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` (\`cache_key\`), UNIQUE INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` (\`cache_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`anime_genres\` (\`anime_id\` int NOT NULL, \`genre_id\` int NOT NULL, INDEX \`IDX_26c6171c309c7083f2c841fcea\` (\`anime_id\`), INDEX \`IDX_b8fea2c497bd1ed5fd57ac23b0\` (\`genre_id\`), PRIMARY KEY (\`anime_id\`, \`genre_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`download_links\` ADD CONSTRAINT \`FK_cddafb1e1ffdcc3fad35cf46d1f\` FOREIGN KEY (\`episode_id\`) REFERENCES \`episodes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episodes\` ADD CONSTRAINT \`FK_9d3063c2bbc60082263d00c291f\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_logs\` ADD CONSTRAINT \`FK_aea5b9190a22274d80784b7a035\` FOREIGN KEY (\`job_id\`) REFERENCES \`crawl_jobs\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_jobs\` ADD CONSTRAINT \`FK_967b6d0bdab9d0811ea3d63316c\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime\` ADD CONSTRAINT \`FK_f6a96de0204d37aae93e2b62e6d\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime_update_history\` ADD CONSTRAINT \`FK_9564c07cc4861432b4ec9424d5c\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`source_health\` ADD CONSTRAINT \`FK_f287ed7b8766e711115e8d846f6\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` ADD CONSTRAINT \`FK_26c6171c309c7083f2c841fcea8\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` ADD CONSTRAINT \`FK_b8fea2c497bd1ed5fd57ac23b04\` FOREIGN KEY (\`genre_id\`) REFERENCES \`genres\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_genres\` DROP FOREIGN KEY \`FK_b8fea2c497bd1ed5fd57ac23b04\``);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` DROP FOREIGN KEY \`FK_26c6171c309c7083f2c841fcea8\``);
        await queryRunner.query(`ALTER TABLE \`source_health\` DROP FOREIGN KEY \`FK_f287ed7b8766e711115e8d846f6\``);
        await queryRunner.query(`ALTER TABLE \`anime_update_history\` DROP FOREIGN KEY \`FK_9564c07cc4861432b4ec9424d5c\``);
        await queryRunner.query(`ALTER TABLE \`anime\` DROP FOREIGN KEY \`FK_f6a96de0204d37aae93e2b62e6d\``);
        await queryRunner.query(`ALTER TABLE \`crawl_jobs\` DROP FOREIGN KEY \`FK_967b6d0bdab9d0811ea3d63316c\``);
        await queryRunner.query(`ALTER TABLE \`crawl_logs\` DROP FOREIGN KEY \`FK_aea5b9190a22274d80784b7a035\``);
        await queryRunner.query(`ALTER TABLE \`episodes\` DROP FOREIGN KEY \`FK_9d3063c2bbc60082263d00c291f\``);
        await queryRunner.query(`ALTER TABLE \`download_links\` DROP FOREIGN KEY \`FK_cddafb1e1ffdcc3fad35cf46d1f\``);
        await queryRunner.query(`DROP INDEX \`IDX_b8fea2c497bd1ed5fd57ac23b0\` ON \`anime_genres\``);
        await queryRunner.query(`DROP INDEX \`IDX_26c6171c309c7083f2c841fcea\` ON \`anime_genres\``);
        await queryRunner.query(`DROP TABLE \`anime_genres\``);
        await queryRunner.query(`DROP INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` ON \`cache_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` ON \`cache_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_4ee5bb647af323bfa4b64b9f45\` ON \`cache_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_727122153244e584c366996a3e\` ON \`cache_entries\``);
        await queryRunner.query(`DROP TABLE \`cache_entries\``);
        await queryRunner.query(`DROP INDEX \`IDX_f287ed7b8766e711115e8d846f\` ON \`source_health\``);
        await queryRunner.query(`DROP INDEX \`IDX_8ce120d8fb709de4d10530bcbe\` ON \`source_health\``);
        await queryRunner.query(`DROP TABLE \`source_health\``);
        await queryRunner.query(`DROP INDEX \`IDX_9a5cea873a16f3b91692a889d1\` ON \`sources\``);
        await queryRunner.query(`DROP TABLE \`sources\``);
    }

}
