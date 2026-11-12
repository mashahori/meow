import { PoolClient } from "pg";
import { pool } from "../db/pool";
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../validators/category.validator";

export type CategoryRow = {
  id: string;
  budgetId: string;
  name: string;
  groupSlug: string | null;
  plannedAmount: string;
  spentAmount: string;
  remainingAmount: string;
};

const CATEGORY_SELECT = `
  SELECT
    c.id,
    c.budget_id AS "budgetId",
    c.name,
    c.group_slug AS "groupSlug",
    c.planned_amount::text AS "plannedAmount",
    COALESCE(SUM(e.amount), 0)::numeric(12,0)::text AS "spentAmount",
    (c.planned_amount - COALESCE(SUM(e.amount), 0))::numeric(12,0)::text AS "remainingAmount"
  FROM categories c
  LEFT JOIN expenses e ON e.category_id = c.id
`;

export async function listCategories(budgetId: string): Promise<CategoryRow[]> {
  const result = await pool.query<CategoryRow>(
    `${CATEGORY_SELECT}
     WHERE c.budget_id = $1
     GROUP BY c.id
     ORDER BY c.name`,
    [budgetId],
  );
  return result.rows;
}

export async function findOwnedCategory(
  categoryId: string,
  userId: string,
): Promise<CategoryRow | null> {
  const result = await pool.query<CategoryRow>(
    `${CATEGORY_SELECT}
     JOIN budgets b ON b.id = c.budget_id
     WHERE c.id = $1 AND b.user_id = $2
     GROUP BY c.id`,
    [categoryId, userId],
  );
  return result.rows[0] ?? null;
}

export async function findCategoryInBudget(
  categoryId: string,
  budgetId: string,
): Promise<CategoryRow | null> {
  const result = await pool.query<CategoryRow>(
    `${CATEGORY_SELECT}
     WHERE c.id = $1 AND c.budget_id = $2
     GROUP BY c.id`,
    [categoryId, budgetId],
  );
  return result.rows[0] ?? null;
}

export async function insertCategory(
  budgetId: string,
  data: CreateCategoryPayload,
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO categories (budget_id, name, planned_amount, group_slug)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [budgetId, data.name, data.plannedAmount, data.groupSlug ?? null],
  );
  return result.rows[0].id;
}

// The group has its own "was it sent" flag because null is a real value there: it removes the group.
export async function updateOwnedCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryPayload,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE categories c SET
       name = COALESCE($3, c.name),
       planned_amount = COALESCE($4::numeric, c.planned_amount),
       group_slug = CASE WHEN $5::boolean THEN $6::varchar ELSE c.group_slug END,
       updated_at = now()
     FROM budgets b
     WHERE c.id = $1 AND c.budget_id = b.id AND b.user_id = $2`,
    [
      categoryId,
      userId,
      data.name ?? null,
      data.plannedAmount ?? null,
      data.groupSlug !== undefined,
      data.groupSlug ?? null,
    ],
  );
  return (result.rowCount ?? 0) > 0;
}

// Expenses are removed first because expenses.category_id references categories with ON DELETE RESTRICT.
// Both deletes run in one transaction, so a category is never removed without its expenses.
export async function deleteOwnedCategory(
  categoryId: string,
  userId: string,
): Promise<boolean> {
  const client: PoolClient = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM expenses e
       WHERE e.category_id = $1
         AND EXISTS (
           SELECT 1 FROM categories c
           JOIN budgets b ON b.id = c.budget_id
           WHERE c.id = $1 AND b.user_id = $2
         )`,
      [categoryId, userId],
    );
    const result = await client.query(
      `DELETE FROM categories c
       USING budgets b
       WHERE c.id = $1 AND c.budget_id = b.id AND b.user_id = $2`,
      [categoryId, userId],
    );
    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
