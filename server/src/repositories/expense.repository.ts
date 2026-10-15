import { pool } from '../db/pool';
import { CreateExpensePayload, UpdateExpensePayload } from '../validators/expense.validator';

export type ExpenseRow = {
  id: string;
  budgetId: string;
  categoryId: string;
  amount: string;
  spentAt: string;
  note: string | null;
};

export type BudgetPeriod = {
  startDate: string;
  endDate: string;
};

const EXPENSE_SELECT = `
  SELECT
    e.id,
    e.budget_id AS "budgetId",
    e.category_id AS "categoryId",
    e.amount::text AS amount,
    to_char(e.spent_at, 'YYYY-MM-DD') AS "spentAt",
    e.note
  FROM expenses e
`;

export async function listExpenses(budgetId: string): Promise<ExpenseRow[]> {
  const result = await pool.query<ExpenseRow>(
    `${EXPENSE_SELECT}
     WHERE e.budget_id = $1
     ORDER BY e.spent_at DESC, e.created_at DESC`,
    [budgetId],
  );
  return result.rows;
}

export async function listExpensesByCategory(
  categoryId: string,
  userId: string,
): Promise<ExpenseRow[]> {
  const result = await pool.query<ExpenseRow>(
    `${EXPENSE_SELECT}
     JOIN budgets b ON b.id = e.budget_id
     WHERE e.category_id = $1 AND b.user_id = $2
     ORDER BY e.spent_at DESC, e.created_at DESC`,
    [categoryId, userId],
  );
  return result.rows;
}

export async function findOwnedExpense(
  expenseId: string,
  userId: string,
): Promise<ExpenseRow | null> {
  const result = await pool.query<ExpenseRow>(
    `${EXPENSE_SELECT}
     JOIN budgets b ON b.id = e.budget_id
     WHERE e.id = $1 AND b.user_id = $2`,
    [expenseId, userId],
  );
  return result.rows[0] ?? null;
}

export async function findCategoryBudget(
  categoryId: string,
  userId: string,
): Promise<string | null> {
  const result = await pool.query<{ budgetId: string }>(
    `SELECT c.budget_id AS "budgetId"
     FROM categories c
     JOIN budgets b ON b.id = c.budget_id
     WHERE c.id = $1 AND b.user_id = $2`,
    [categoryId, userId],
  );
  return result.rows[0]?.budgetId ?? null;
}

export async function findBudgetPeriod(
  budgetId: string,
  userId: string,
): Promise<BudgetPeriod | null> {
  const result = await pool.query<BudgetPeriod>(
    `SELECT
       to_char(start_date, 'YYYY-MM-DD') AS "startDate",
       to_char(end_date, 'YYYY-MM-DD') AS "endDate"
     FROM budgets
     WHERE id = $1 AND user_id = $2`,
    [budgetId, userId],
  );
  return result.rows[0] ?? null;
}

export async function insertExpense(budgetId: string, data: CreateExpensePayload): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO expenses (budget_id, category_id, amount, spent_at, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [budgetId, data.categoryId, data.amount, data.spentAt, data.note ?? null],
  );
  return result.rows[0].id;
}

export async function updateOwnedExpense(
  expenseId: string,
  userId: string,
  data: UpdateExpensePayload,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE expenses e SET
       category_id = COALESCE($3, e.category_id),
       amount = COALESCE($4, e.amount),
       spent_at = COALESCE($5::date, e.spent_at),
       note = CASE WHEN $6::boolean THEN $7 ELSE e.note END,
       updated_at = now()
     FROM budgets b
     WHERE e.id = $1 AND e.budget_id = b.id AND b.user_id = $2`,
    [
      expenseId,
      userId,
      data.categoryId ?? null,
      data.amount ?? null,
      data.spentAt ?? null,
      data.note !== undefined,
      data.note ?? null,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteOwnedExpense(expenseId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM expenses e
     USING budgets b
     WHERE e.id = $1 AND e.budget_id = b.id AND b.user_id = $2`,
    [expenseId, userId],
  );
  return (result.rowCount ?? 0) > 0;
}
