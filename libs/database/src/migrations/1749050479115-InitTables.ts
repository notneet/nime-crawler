import { MigrationInterface, QueryRunner } from "typeorm";

export class InitTables1749050479115 implements MigrationInterface {
    name = 'InitTables1749050479115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` ON \`cache_entries\``);
        await queryRunner.query(`CREATE TABLE \`queue_jobs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`queue_name\` varchar(100) NOT NULL, \`job_data\` text NOT NULL, \`status\` enum ('waiting', 'active', 'completed', 'failed', 'delayed') NOT NULL DEFAULT 'waiting', \`attempts\` int NOT NULL DEFAULT '0', \`max_attempts\` int NOT NULL DEFAULT '3', \`scheduled_at\` timestamp NULL, \`processed_at\` timestamp NULL, \`error_message\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_5d66d6a093d8d7ac1a879b7a30\` (\`scheduled_at\`), INDEX \`IDX_68ced099a28e1d2d9b88223f64\` (\`status\`), INDEX \`IDX_61423160d46bd87e20380712aa\` (\`queue_name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_logs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`job_id\` int NOT NULL, \`level\` enum ('info', 'warning', 'error', 'debug') NOT NULL, \`message\` text NOT NULL, \`context\` json NULL, \`url\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_8796d9fb5c3a92b85a84fd53f8\` (\`created_at\`), INDEX \`IDX_15dd00f74d60c1b194e654a2c1\` (\`level\`), INDEX \`IDX_aea5b9190a22274d80784b7a03\` (\`job_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`crawl_jobs\` (\`id\` int NOT NULL AUTO_INCREMENT, \`source_id\` int NOT NULL, \`job_type\` enum ('full_crawl', 'update_check', 'new_episodes', 'fix_broken_links') NOT NULL, \`status\` enum ('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending', \`priority\` int NOT NULL DEFAULT '0', \`parameters\` json NULL, \`scheduled_at\` timestamp NULL, \`started_at\` timestamp NULL, \`completed_at\` timestamp NULL, \`error_message\` text NULL, \`result_summary\` json NULL, \`retry_count\` int NOT NULL DEFAULT '0', \`max_retries\` int NOT NULL DEFAULT '3', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_9a2ecfc045315c5119c9caed35\` (\`scheduled_at\`), INDEX \`IDX_3080b5173e786addd7def0c82e\` (\`job_type\`), INDEX \`IDX_13ffa2e790ff4931f9b116e803\` (\`status\`), INDEX \`IDX_967b6d0bdab9d0811ea3d63316\` (\`source_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`anime_update_history\` (\`id\` int NOT NULL AUTO_INCREMENT, \`anime_id\` int NOT NULL, \`changes\` json NOT NULL, \`change_type\` enum ('new_episode', 'metadata_update', 'status_change', 'links_update') NOT NULL, \`source_trigger\` text NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`IDX_d98d6258f0b70918ee4b2060ab\` (\`updated_at\`), INDEX \`IDX_9564c07cc4861432b4ec9424d5\` (\`anime_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`download_links\` (\`id\` int NOT NULL AUTO_INCREMENT, \`episode_id\` int NOT NULL, \`provider\` varchar(100) NOT NULL, \`url\` text NOT NULL, \`quality\` varchar(20) NOT NULL, \`format\` varchar(20) NULL, \`file_size_bytes\` bigint NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`last_checked_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_882318f0444faea04ee7d76ea6\` (\`quality\`), INDEX \`IDX_a5fb8506d10d1e5ec4e93a0154\` (\`provider\`), INDEX \`IDX_cddafb1e1ffdcc3fad35cf46d1\` (\`episode_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`episodes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`anime_id\` int NOT NULL, \`episode_number\` smallint NOT NULL, \`title\` varchar(255) NULL, \`source_episode_id\` varchar(100) NOT NULL, \`source_url\` text NOT NULL, \`thumbnail_url\` text NULL, \`description\` text NULL, \`duration_seconds\` int NULL, \`air_date\` date NULL, \`view_count\` int NOT NULL DEFAULT '0', \`download_count\` int NOT NULL DEFAULT '0', \`is_available\` tinyint NOT NULL DEFAULT 1, \`last_checked_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_bb36da96b51635996fc7fa4c7f\` (\`source_episode_id\`), INDEX \`IDX_9d3063c2bbc60082263d00c291\` (\`anime_id\`), UNIQUE INDEX \`IDX_5729db763fdc1c5a943593a8cb\` (\`anime_id\`, \`episode_number\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`genres\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`slug\` varchar(100) NOT NULL, \`description\` text NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_f105f8230a83b86a346427de94\` (\`name\`), UNIQUE INDEX \`IDX_d1cbe4fe39bdfc77c76e94eada\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`anime\` (\`id\` int NOT NULL AUTO_INCREMENT, \`title\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`alternative_title\` varchar(255) NULL, \`synopsis\` text NULL, \`poster_url\` text NULL, \`banner_url\` text NULL, \`type\` enum ('TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music') NOT NULL DEFAULT 'TV', \`status\` enum ('Ongoing', 'Completed', 'Upcoming', 'Hiatus') NOT NULL DEFAULT 'Ongoing', \`total_episodes\` smallint NULL, \`release_year\` smallint NULL, \`season\` enum ('Spring', 'Summer', 'Fall', 'Winter') NULL, \`rating\` decimal(3,1) NULL, \`view_count\` int NOT NULL DEFAULT '0', \`download_count\` int NOT NULL DEFAULT '0', \`source_id\` int NOT NULL, \`source_anime_id\` varchar(100) NOT NULL, \`source_url\` text NOT NULL, \`last_updated_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_5d0ffd2a6f4ce38af5e2f0a52f\` (\`release_year\`), INDEX \`IDX_ee8f7d2e05dacf165cb7badb19\` (\`type\`), INDEX \`IDX_fff1bb5201c112dbc7235cec57\` (\`status\`), UNIQUE INDEX \`IDX_2379b25edab1e004993c1874a7\` (\`source_anime_id\`), UNIQUE INDEX \`IDX_f6a96de0204d37aae93e2b62e6\` (\`source_id\`), UNIQUE INDEX \`IDX_eb697220f0bea58bc6b034dc74\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`sources\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(100) NOT NULL, \`slug\` varchar(50) NOT NULL, \`base_url\` text NOT NULL, \`selectors\` json NULL, \`headers\` json NULL, \`priority\` smallint NOT NULL DEFAULT '1', \`is_active\` tinyint NOT NULL DEFAULT 1, \`delay_ms\` int NOT NULL DEFAULT '5000', \`last_crawled_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9a5cea873a16f3b91692a889d1\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`source_health\` (\`id\` int NOT NULL AUTO_INCREMENT, \`source_id\` int NOT NULL, \`is_accessible\` tinyint NOT NULL, \`response_time_ms\` int NULL, \`http_status_code\` int NULL, \`error_message\` text NULL, \`success_rate_24h\` int NOT NULL DEFAULT '0', \`checked_at\` timestamp NOT NULL, INDEX \`IDX_8ce120d8fb709de4d10530bcbe\` (\`checked_at\`), INDEX \`IDX_f287ed7b8766e711115e8d846f\` (\`source_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`cache_entries\` ADD UNIQUE INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` (\`cache_key\`)`);
        await queryRunner.query(`ALTER TABLE \`crawl_logs\` ADD CONSTRAINT \`FK_aea5b9190a22274d80784b7a035\` FOREIGN KEY (\`job_id\`) REFERENCES \`crawl_jobs\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`crawl_jobs\` ADD CONSTRAINT \`FK_967b6d0bdab9d0811ea3d63316c\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime_update_history\` ADD CONSTRAINT \`FK_9564c07cc4861432b4ec9424d5c\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`download_links\` ADD CONSTRAINT \`FK_cddafb1e1ffdcc3fad35cf46d1f\` FOREIGN KEY (\`episode_id\`) REFERENCES \`episodes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`episodes\` ADD CONSTRAINT \`FK_9d3063c2bbc60082263d00c291f\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime\` ADD CONSTRAINT \`FK_f6a96de0204d37aae93e2b62e6d\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`source_health\` ADD CONSTRAINT \`FK_f287ed7b8766e711115e8d846f6\` FOREIGN KEY (\`source_id\`) REFERENCES \`sources\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` ADD CONSTRAINT \`FK_26c6171c309c7083f2c841fcea8\` FOREIGN KEY (\`anime_id\`) REFERENCES \`anime\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` ADD CONSTRAINT \`FK_b8fea2c497bd1ed5fd57ac23b04\` FOREIGN KEY (\`genre_id\`) REFERENCES \`genres\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_genres\` DROP FOREIGN KEY \`FK_b8fea2c497bd1ed5fd57ac23b04\``);
        await queryRunner.query(`ALTER TABLE \`anime_genres\` DROP FOREIGN KEY \`FK_26c6171c309c7083f2c841fcea8\``);
        await queryRunner.query(`ALTER TABLE \`source_health\` DROP FOREIGN KEY \`FK_f287ed7b8766e711115e8d846f6\``);
        await queryRunner.query(`ALTER TABLE \`anime\` DROP FOREIGN KEY \`FK_f6a96de0204d37aae93e2b62e6d\``);
        await queryRunner.query(`ALTER TABLE \`episodes\` DROP FOREIGN KEY \`FK_9d3063c2bbc60082263d00c291f\``);
        await queryRunner.query(`ALTER TABLE \`download_links\` DROP FOREIGN KEY \`FK_cddafb1e1ffdcc3fad35cf46d1f\``);
        await queryRunner.query(`ALTER TABLE \`anime_update_history\` DROP FOREIGN KEY \`FK_9564c07cc4861432b4ec9424d5c\``);
        await queryRunner.query(`ALTER TABLE \`crawl_jobs\` DROP FOREIGN KEY \`FK_967b6d0bdab9d0811ea3d63316c\``);
        await queryRunner.query(`ALTER TABLE \`crawl_logs\` DROP FOREIGN KEY \`FK_aea5b9190a22274d80784b7a035\``);
        await queryRunner.query(`ALTER TABLE \`cache_entries\` DROP INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\``);
        await queryRunner.query(`DROP INDEX \`IDX_f287ed7b8766e711115e8d846f\` ON \`source_health\``);
        await queryRunner.query(`DROP INDEX \`IDX_8ce120d8fb709de4d10530bcbe\` ON \`source_health\``);
        await queryRunner.query(`DROP TABLE \`source_health\``);
        await queryRunner.query(`DROP INDEX \`IDX_9a5cea873a16f3b91692a889d1\` ON \`sources\``);
        await queryRunner.query(`DROP TABLE \`sources\``);
        await queryRunner.query(`DROP INDEX \`IDX_eb697220f0bea58bc6b034dc74\` ON \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_f6a96de0204d37aae93e2b62e6\` ON \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_2379b25edab1e004993c1874a7\` ON \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_fff1bb5201c112dbc7235cec57\` ON \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_ee8f7d2e05dacf165cb7badb19\` ON \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_5d0ffd2a6f4ce38af5e2f0a52f\` ON \`anime\``);
        await queryRunner.query(`DROP TABLE \`anime\``);
        await queryRunner.query(`DROP INDEX \`IDX_d1cbe4fe39bdfc77c76e94eada\` ON \`genres\``);
        await queryRunner.query(`DROP INDEX \`IDX_f105f8230a83b86a346427de94\` ON \`genres\``);
        await queryRunner.query(`DROP TABLE \`genres\``);
        await queryRunner.query(`DROP INDEX \`IDX_5729db763fdc1c5a943593a8cb\` ON \`episodes\``);
        await queryRunner.query(`DROP INDEX \`IDX_9d3063c2bbc60082263d00c291\` ON \`episodes\``);
        await queryRunner.query(`DROP INDEX \`IDX_bb36da96b51635996fc7fa4c7f\` ON \`episodes\``);
        await queryRunner.query(`DROP TABLE \`episodes\``);
        await queryRunner.query(`DROP INDEX \`IDX_cddafb1e1ffdcc3fad35cf46d1\` ON \`download_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_a5fb8506d10d1e5ec4e93a0154\` ON \`download_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_882318f0444faea04ee7d76ea6\` ON \`download_links\``);
        await queryRunner.query(`DROP TABLE \`download_links\``);
        await queryRunner.query(`DROP INDEX \`IDX_9564c07cc4861432b4ec9424d5\` ON \`anime_update_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_d98d6258f0b70918ee4b2060ab\` ON \`anime_update_history\``);
        await queryRunner.query(`DROP TABLE \`anime_update_history\``);
        await queryRunner.query(`DROP INDEX \`IDX_967b6d0bdab9d0811ea3d63316\` ON \`crawl_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_13ffa2e790ff4931f9b116e803\` ON \`crawl_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_3080b5173e786addd7def0c82e\` ON \`crawl_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_9a2ecfc045315c5119c9caed35\` ON \`crawl_jobs\``);
        await queryRunner.query(`DROP TABLE \`crawl_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_aea5b9190a22274d80784b7a03\` ON \`crawl_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_15dd00f74d60c1b194e654a2c1\` ON \`crawl_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_8796d9fb5c3a92b85a84fd53f8\` ON \`crawl_logs\``);
        await queryRunner.query(`DROP TABLE \`crawl_logs\``);
        await queryRunner.query(`DROP INDEX \`IDX_61423160d46bd87e20380712aa\` ON \`queue_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_68ced099a28e1d2d9b88223f64\` ON \`queue_jobs\``);
        await queryRunner.query(`DROP INDEX \`IDX_5d66d6a093d8d7ac1a879b7a30\` ON \`queue_jobs\``);
        await queryRunner.query(`DROP TABLE \`queue_jobs\``);
        await queryRunner.query(`CREATE INDEX \`IDX_41b6ffb54b6b090f8bb29cded2\` ON \`cache_entries\` (\`cache_key\`)`);
    }

}
