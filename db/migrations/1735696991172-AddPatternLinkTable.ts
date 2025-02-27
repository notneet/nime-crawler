import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatternLinkTable1735696991172 implements MigrationInterface {
    name = 'AddPatternLinkTable1735696991172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pattern_link\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`media_id\` bigint UNSIGNED NOT NULL, \`pattern\` json NULL, \`n_status\` tinyint NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX \`IDX_6248ef1a50e909aaabe1d60442\` (\`media_id\`), INDEX \`IDX_97d32450bf10a7e238c5432e26\` (\`n_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_97d32450bf10a7e238c5432e26\` ON \`pattern_link\``);
        await queryRunner.query(`DROP INDEX \`IDX_6248ef1a50e909aaabe1d60442\` ON \`pattern_link\``);
        await queryRunner.query(`DROP TABLE \`pattern_link\``);
    }

}
