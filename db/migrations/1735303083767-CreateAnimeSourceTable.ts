import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnimeSourceTable1735303083767 implements MigrationInterface {
    name = 'CreateAnimeSourceTable1735303083767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`anime_source\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`last_run_at\` datetime NOT NULL, \`n_status\` tinyint NULL DEFAULT '0', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_151596e23d035915d0ce39e4ef\` (\`url\`), INDEX \`IDX_8772076d65f0706f0cafda5861\` (\`last_run_at\`), INDEX \`IDX_95644e182fd204978e9a35dc27\` (\`n_status\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_95644e182fd204978e9a35dc27\` ON \`anime_source\``);
        await queryRunner.query(`DROP INDEX \`IDX_8772076d65f0706f0cafda5861\` ON \`anime_source\``);
        await queryRunner.query(`DROP INDEX \`IDX_151596e23d035915d0ce39e4ef\` ON \`anime_source\``);
        await queryRunner.query(`DROP TABLE \`anime_source\``);
    }

}
