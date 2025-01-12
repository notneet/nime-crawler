import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatternWatchTable1735388588535 implements MigrationInterface {
    name = 'AddPatternWatchTable1735388588535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pattern_watch\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`media_id\` bigint UNSIGNED NOT NULL, \`pattern\` json NULL, \`n_status\` tinyint NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX \`IDX_4cfa91153abc20f66e8803c1db\` (\`media_id\`), INDEX \`IDX_70e27fbc977df6c03981f7f1b4\` (\`n_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_70e27fbc977df6c03981f7f1b4\` ON \`pattern_watch\``);
        await queryRunner.query(`DROP INDEX \`IDX_4cfa91153abc20f66e8803c1db\` ON \`pattern_watch\``);
        await queryRunner.query(`DROP TABLE \`pattern_watch\``);
    }

}
