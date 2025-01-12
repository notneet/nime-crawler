import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldNameTest1734191008389 implements MigrationInterface {
    name = 'AddFieldNameTest1734191008389'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`test\` ADD \`name\` varchar(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`test\` DROP COLUMN \`name\``);
    }

}
