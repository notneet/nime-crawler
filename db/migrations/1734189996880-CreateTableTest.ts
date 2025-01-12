import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableTest1734189996880 implements MigrationInterface {
    name = 'CreateTableTest1734189996880'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`test\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`query-result-cache\` (\`id\` int NOT NULL AUTO_INCREMENT, \`identifier\` varchar(255) NULL, \`time\` bigint NOT NULL, \`duration\` int NOT NULL, \`query\` text NOT NULL, \`result\` text NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`query-result-cache\``);
        await queryRunner.query(`DROP TABLE \`test\``);
    }

}
