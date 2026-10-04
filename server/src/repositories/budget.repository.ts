import { pool } from "../db/pool";

export async function isBudgetOwnedByUser(
  budgetId: string,
  userId: string,
): Promise<boolean> {
  const result = await pool.query(
    "SELECT 1 FROM budgets WHERE id = $1 AND user_id = $2 LIMIT 1",
    [budgetId, userId],
  );

  return result.rows.length > 0;
}
