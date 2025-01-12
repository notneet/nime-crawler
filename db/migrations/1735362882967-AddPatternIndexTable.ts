import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatternIndexTable1735362882967 implements MigrationInterface {
    name = 'AddPatternIndexTable1735362882967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pattern_index\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`media_id\` bigint UNSIGNED NOT NULL, \`pattern\` json NULL, \`n_status\` tinyint NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX \`IDX_426f15ebaba46889c30dcefbff\` (\`media_id\`), INDEX \`IDX_858d2883f3d1ad3dc668bdad23\` (\`n_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_858d2883f3d1ad3dc668bdad23\` ON \`pattern_index\``);
        await queryRunner.query(`DROP INDEX \`IDX_426f15ebaba46889c30dcefbff\` ON \`pattern_index\``);
        await queryRunner.query(`DROP TABLE \`pattern_index\``);
    }

}
