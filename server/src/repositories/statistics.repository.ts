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

export type MonthlyGroupPlanRow = {
  currency: MonthlyExpenseRow['currency'];
  groupSlug: string | null;
  plannedAmount: string;
};

// A budget's plan is prorated by the number of its days that fall within the month.
export async function listMonthlyGroupPlans(
  userId: string,
  monthStart: string,
): Promise<MonthlyGroupPlanRow[]> {
  const result = await pool.query<MonthlyGroupPlanRow>(
    `SELECT
       b.currency,
       c.group_slug AS "groupSlug",
       ROUND(SUM(
         c.planned_amount
           * (LEAST(b.end_date, ($2::date + INTERVAL '1 month' - INTERVAL '1 day')::date)
              - GREATEST(b.start_date, $2::date) + 1)
           / (b.end_date - b.start_date + 1)
       ), 2)::text AS "plannedAmount"
     FROM categories c
     JOIN budgets b ON b.id = c.budget_id
     WHERE b.user_id = $1
       AND b.start_date < ($2::date + INTERVAL '1 month')
       AND b.end_date >= $2::date
     GROUP BY b.currency, c.group_slug`,
    [userId, monthStart],
  );
  return result.rows;
}
