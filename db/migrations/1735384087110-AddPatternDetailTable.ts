import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatternDetailTable1735384087110 implements MigrationInterface {
    name = 'AddPatternDetailTable1735384087110'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pattern_detail\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`media_id\` bigint UNSIGNED NOT NULL, \`pattern\` json NULL, \`n_status\` tinyint NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX \`IDX_5bf692e26d3e141f19e0000e1d\` (\`media_id\`), INDEX \`IDX_06ede40e2665b44cc99b3e3146\` (\`n_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_06ede40e2665b44cc99b3e3146\` ON \`pattern_detail\``);
        await queryRunner.query(`DROP INDEX \`IDX_5bf692e26d3e141f19e0000e1d\` ON \`pattern_detail\``);
        await queryRunner.query(`DROP TABLE \`pattern_detail\``);
    }

}
