import { QueryRunner } from 'typeorm';
import { EnforceCaseInsensitiveUserEmail1785120000000 } from '../migrations/1785120000000-enforceCaseInsensitiveUserEmail';

const preflightSql = `SELECT LOWER(TRIM("email")) AS "normalized_email", COUNT(*) AS "count"
FROM "users"
GROUP BY LOWER(TRIM("email"))
HAVING COUNT(*) > 1
LIMIT 1`;

const normalizeEmailSql = 'UPDATE "users" SET "email" = LOWER(TRIM("email"))';
const dropOriginalConstraintSql =
  'ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"';
const createExpressionIndexSql =
  'CREATE UNIQUE INDEX "IDX_users_email_lower_unique" ON "users" (LOWER("email"))';
const dropExpressionIndexSql = 'DROP INDEX "IDX_users_email_lower_unique"';
const restoreOriginalConstraintSql =
  'ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")';

describe('EnforceCaseInsensitiveUserEmail1785120000000', () => {
  it('normalizes emails and replaces the unique constraint after a clear preflight', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const queryRunner = { query } as unknown as QueryRunner;

    await new EnforceCaseInsensitiveUserEmail1785120000000().up(queryRunner);

    expect(query).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenNthCalledWith(1, preflightSql);
    expect(query).toHaveBeenNthCalledWith(2, normalizeEmailSql);
    expect(query).toHaveBeenNthCalledWith(3, dropOriginalConstraintSql);
    expect(query).toHaveBeenNthCalledWith(4, createExpressionIndexSql);
  });

  it('aborts before mutation when normalized emails collide', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([
        { normalized_email: 'user@example.com', count: '2' },
      ]);
    const queryRunner = { query } as unknown as QueryRunner;

    await expect(
      new EnforceCaseInsensitiveUserEmail1785120000000().up(queryRunner),
    ).rejects.toThrow(
      'Cannot normalize users.email: case-insensitive duplicates exist',
    );

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledWith(preflightSql);
  });

  it('restores the original unique constraint when rolled back', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const queryRunner = { query } as unknown as QueryRunner;

    await new EnforceCaseInsensitiveUserEmail1785120000000().down(queryRunner);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenNthCalledWith(1, dropExpressionIndexSql);
    expect(query).toHaveBeenNthCalledWith(2, restoreOriginalConstraintSql);
  });
});
