import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnforceCaseInsensitiveUserEmail1785120000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates =
      (await queryRunner.query(`SELECT LOWER(TRIM("email")) AS "normalized_email", COUNT(*) AS "count"
FROM "users"
GROUP BY LOWER(TRIM("email"))
HAVING COUNT(*) > 1
LIMIT 1`)) as Array<{ normalized_email: string; count: string }>;

    if (duplicates.length > 0) {
      throw new Error(
        'Cannot normalize users.email: case-insensitive duplicates exist',
      );
    }

    await queryRunner.query(
      'UPDATE "users" SET "email" = LOWER(TRIM("email"))',
    );
    await queryRunner.query(
      'ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_users_email_lower_unique" ON "users" (LOWER("email"))',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_users_email_lower_unique"');
    await queryRunner.query(
      'ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")',
    );
  }
}
