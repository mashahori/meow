import { PoolClient } from 'pg';
import { pool } from '../db/pool';

export type BudgetRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'archived';
  initialAmount: string;
  currency: string;
  plannedAmount: string;
  spentAmount: string;
  remainingAmount: string;
  isActive: boolean;
};

export type CategorySummaryRow = {
  id: string;
  name: string;
  plannedAmount: string;
  spentAmount: string;
};

// Dates are formatted in SQL so they are never shifted by the server time zone.
const BUDGET_SELECT = `
  SELECT
    b.id,
    b.name,
    to_char(b.start_date, 'YYYY-MM-DD') AS "startDate",
    to_char(b.end_date, 'YYYY-MM-DD') AS "endDate",
    b.status,
    b.initial_amount::text AS "initialAmount",
    b.currency,
    COALESCE((SELECT SUM(c.planned_amount) FROM categories c WHERE c.budget_id = b.id), 0)::numeric(12,0)::text AS "plannedAmount",
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.budget_id = b.id), 0)::numeric(12,0)::text AS "spentAmount",
    (
      COALESCE((SELECT SUM(c.planned_amount) FROM categories c WHERE c.budget_id = b.id), 0) -
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.budget_id = b.id), 0)
    )::numeric(12,0)::text AS "remainingAmount",
    EXISTS (
      SELECT 1 FROM active_budgets ab WHERE ab.budget_id = b.id AND ab.user_id = b.user_id
    ) AS "isActive"
  FROM budgets b
`;

export async function isBudgetOwnedByUser(budgetId: string, userId: string): Promise<boolean> {
  const result = await pool.query('SELECT 1 FROM budgets WHERE id = $1 AND user_id = $2 LIMIT 1', [
    budgetId,
    userId,
  ]);

  return result.rows.length > 0;
}

export async function listBudgets(userId: string): Promise<BudgetRow[]> {
  const result = await pool.query(
    `${BUDGET_SELECT} WHERE b.user_id = $1 ORDER BY b.start_date DESC, b.created_at DESC`,
    [userId],
  );
  return result.rows;
}

export async function findBudget(budgetId: string, userId: string): Promise<BudgetRow | null> {
  const result = await pool.query(`${BUDGET_SELECT} WHERE b.id = $1 AND b.user_id = $2`, [
    budgetId,
    userId,
  ]);
  return result.rows[0] ?? null;
}

// Returns the most recently activated budget among the user's active budgets.
export async function findActiveBudget(userId: string): Promise<BudgetRow | null> {
  const result = await pool.query(
    `${BUDGET_SELECT}
     JOIN active_budgets ab ON ab.budget_id = b.id AND ab.user_id = b.user_id
     WHERE b.user_id = $1 AND b.status = 'active'
     ORDER BY ab.activated_at DESC
     LIMIT 1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function listBudgetCategories(budgetId: string): Promise<CategorySummaryRow[]> {
  const result = await pool.query(
    `SELECT
       c.id,
       c.name,
       c.planned_amount::text AS "plannedAmount",
       COALESCE(SUM(e.amount), 0)::numeric(12,0)::text AS "spentAmount"
     FROM categories c
     LEFT JOIN expenses e ON e.category_id = c.id
     WHERE c.budget_id = $1
     GROUP BY c.id
     ORDER BY c.name`,
    [budgetId],
  );
  return result.rows;
}

export async function insertBudget(
  userId: string,
  data: {
    name: string;
    startDate: string;
    endDate: string;
    initialAmount: number;
    currency: string;
  },
): Promise<string> {
  const result = await pool.query(
    `INSERT INTO budgets
       (user_id, name, start_date, end_date, initial_amount, currency)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [userId, data.name, data.startDate, data.endDate, data.initialAmount, data.currency],
  );
  return result.rows[0].id;
}

// Returns false when the resulting period is invalid or the budget is missing.
export async function updateBudget(
  budgetId: string,
  userId: string,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    initialAmount?: number;
    currency?: string;
  },
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE budgets SET
       name = COALESCE($3, name),
       start_date = COALESCE($4::date, start_date),
       end_date = COALESCE($5::date, end_date),
       initial_amount = COALESCE($6, initial_amount),
       currency = COALESCE($7, currency),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
       AND COALESCE($5::date, end_date) >= COALESCE($4::date, start_date)`,
    [
      budgetId,
      userId,
      data.name ?? null,
      data.startDate ?? null,
      data.endDate ?? null,
      data.initialAmount ?? null,
      data.currency ?? null,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

// Expenses are removed first because expenses.category_id references categories with ON DELETE RESTRICT.
// Categories and active_budgets rows are removed by cascade.
export async function deleteBudget(budgetId: string, userId: string): Promise<void> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query('DELETE FROM expenses WHERE budget_id = $1', [budgetId]);
    await client.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Archiving and removing the active flag happen in one statement, so they succeed or fail together.
export async function archiveBudget(budgetId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `WITH archived AS (
       UPDATE budgets SET status = 'archived', updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id
     ),
     cleared AS (
       DELETE FROM active_budgets
       WHERE user_id = $2 AND budget_id = $1 AND EXISTS (SELECT 1 FROM archived)
     )
     SELECT EXISTS (SELECT 1 FROM archived) AS archived`,
    [budgetId, userId],
  );
  return result.rows[0].archived === true;
}

export async function unarchiveBudget(budgetId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE budgets SET status = 'active', updated_at = now()
     WHERE id = $1 AND user_id = $2`,
    [budgetId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function setActiveBudget(userId: string, budgetId: string): Promise<void> {
  await pool.query(
    `INSERT INTO active_budgets (user_id, budget_id) VALUES ($1, $2)
     ON CONFLICT (user_id, budget_id) DO UPDATE SET activated_at = now()`,
    [userId, budgetId],
  );
}

export async function clearActiveBudget(userId: string, budgetId: string): Promise<void> {
  await pool.query('DELETE FROM active_budgets WHERE user_id = $1 AND budget_id = $2', [
    userId,
    budgetId,
  ]);
}

export async function getBudgetStatus(budgetId: string, userId: string): Promise<string | null> {
  const result = await pool.query('SELECT status FROM budgets WHERE id = $1 AND user_id = $2', [
    budgetId,
    userId,
  ]);
  return result.rows[0]?.status ?? null;
}
