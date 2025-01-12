import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIntervalMinute1735312350135 implements MigrationInterface {
    name = 'AddIntervalMinute1735312350135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`anime_source\` ADD \`interval_minute\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX \`IDX_e63789e767616b3db2f7277a0d\` ON \`anime_source\` (\`interval_minute\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_e63789e767616b3db2f7277a0d\` ON \`anime_source\``);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`updated_at\` \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` CHANGE \`created_at\` \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`anime_source\` DROP COLUMN \`interval_minute\``);
    }

}
