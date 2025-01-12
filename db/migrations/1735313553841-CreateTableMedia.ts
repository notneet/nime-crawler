import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableMedia1735313553841 implements MigrationInterface {
    name = 'CreateTableMedia1735313553841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`media\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE INDEX \`IDX_42a60c07e4b566f0cc06a1eaaf\` (\`url\`), UNIQUE INDEX \`IDX_f603fc24759b12726df73c1ad4\` (\`name\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f603fc24759b12726df73c1ad4\` ON \`media\``);
        await queryRunner.query(`DROP INDEX \`IDX_42a60c07e4b566f0cc06a1eaaf\` ON \`media\``);
        await queryRunner.query(`DROP TABLE \`media\``);
    }

}
