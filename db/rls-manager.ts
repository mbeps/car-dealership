import { DataSource, EntityManager, QueryRunner } from "typeorm";
import { getDataSource } from "./data-source";

/**
 * Executes a callback within a transaction that simulates Supabase RLS.
 * Sets the `request.jwt.claim.sub` and `role` configuration parameters
 * before executing the callback.
 *
 * @param userId - The Supabase Auth User ID (UUID) or null for anonymous
 * @param callback - The function to execute with the RLS-enabled EntityManager
 * @returns The result of the callback
 */
export async function withRLS<T>(
  userId: string | null,
  callback: (manager: EntityManager) => Promise<T>
): Promise<T> {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Set the role and user ID for RLS
    if (userId) {
      // Authenticated user
      await queryRunner.query(`SET LOCAL role = 'authenticated'`);
      await queryRunner.query(
        `SET LOCAL "request.jwt.claim.sub" = '${userId}'`
      );
    } else {
      // Anonymous user
      await queryRunner.query(`SET LOCAL role = 'anon'`);
    }

    // Execute the callback
    const result = await callback(queryRunner.manager);

    // Commit the transaction
    await queryRunner.commitTransaction();

    return result;
  } catch (error) {
    // Rollback on error
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    // Release the query runner
    await queryRunner.release();
  }
}
