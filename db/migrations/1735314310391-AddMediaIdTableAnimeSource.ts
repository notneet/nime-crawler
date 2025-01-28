import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMediaIdTableAnimeSource1735314310391 implements MigrationInterface {
    name = 'AddMediaIdTableAnimeSource1735314310391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`media_id\` bigint UNSIGNED NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`interval_minute\` \`interval_minute\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX \`IDX_c7d7a9de83f857b93b4e9b2782\` ON \`anime_source\` (\`media_id\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_e63789e767616b3db2f7277a0e\` ON \`anime_source\` (\`interval_minute\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_e63789e767616b3db2f7277a0e\` ON \`anime_source\``);
        await queryRunner.query(`DROP INDEX \`IDX_c7d7a9de83f857b93b4e9b2782\` ON \`anime_source\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`interval_minute\` \`interval_minute\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`media_id\``);
    }

}
