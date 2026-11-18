import { pool } from '../db/pool';

export type MonthlyExpenseRow = {
  id: string;
  amount: string;
  spentAt: string;
  currency: 'RUB' | 'USD' | 'EUR';
  categoryId: string;
  categoryName: string;
  groupSlug: string | null;
  note: string | null;
};

export async function listMonthlyExpenses(
  userId: string,
  monthStart: string,
): Promise<MonthlyExpenseRow[]> {
  const result = await pool.query<MonthlyExpenseRow>(
    `SELECT
       e.id,
       e.amount::text AS amount,
       to_char(e.spent_at, 'YYYY-MM-DD') AS "spentAt",
       b.currency,
       c.id AS "categoryId",
       c.name AS "categoryName",
       c.group_slug AS "groupSlug",
       e.note
     FROM expenses e
     JOIN budgets b ON b.id = e.budget_id
     JOIN categories c ON c.id = e.category_id
     WHERE b.user_id = $1
       AND e.spent_at >= $2::date
       AND e.spent_at < ($2::date + INTERVAL '1 month')
     ORDER BY e.spent_at DESC, e.created_at DESC`,
    [userId, monthStart],
  );
  return result.rows;
}
