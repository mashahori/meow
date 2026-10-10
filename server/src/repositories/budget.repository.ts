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
    COALESCE((SELECT SUM(c.planned_amount) FROM categories c WHERE c.budget_id = b.id), 0)::numeric(12,2)::text AS "plannedAmount",
    COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.budget_id = b.id), 0)::numeric(12,2)::text AS "spentAmount",
    (
      COALESCE((SELECT SUM(c.planned_amount) FROM categories c WHERE c.budget_id = b.id), 0) -
      COALESCE((SELECT SUM(e.amount) FROM expenses e WHERE e.budget_id = b.id), 0)
    )::numeric(12,2)::text AS "remainingAmount",
    (u.active_budget_id = b.id) AS "isActive"
  FROM budgets b
  JOIN users u ON u.id = b.user_id
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

export async function findActiveBudget(userId: string): Promise<BudgetRow | null> {
  const result = await pool.query(
    `${BUDGET_SELECT} WHERE b.user_id = $1 AND b.id = u.active_budget_id AND b.status = 'active'`,
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
       COALESCE(SUM(e.amount), 0)::numeric(12,2)::text AS "spentAmount"
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

export async function archiveBudget(budgetId: string, userId: string): Promise<void> {
  await pool.query(
    "UPDATE budgets SET status = 'archived', updated_at = now() WHERE id = $1 AND user_id = $2",
    [budgetId, userId],
  );
  await pool.query(
    'UPDATE users SET active_budget_id = NULL WHERE id = $1 AND active_budget_id = $2',
    [userId, budgetId],
  );
}

export async function setActiveBudget(userId: string, budgetId: string | null): Promise<void> {
  await pool.query('UPDATE users SET active_budget_id = $2 WHERE id = $1', [userId, budgetId]);
}

export async function getBudgetStatus(budgetId: string, userId: string): Promise<string | null> {
  const result = await pool.query('SELECT status FROM budgets WHERE id = $1 AND user_id = $2', [
    budgetId,
    userId,
  ]);
  return result.rows[0]?.status ?? null;
}
