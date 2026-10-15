import { pool } from "../db/pool";
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../validators/category.validator";

export type CategoryRow = {
  id: string;
  budgetId: string;
  name: string;
  plannedAmount: string;
  spentAmount: string;
  remainingAmount: string;
};

const CATEGORY_SELECT = `
  SELECT
    c.id,
    c.budget_id AS "budgetId",
    c.name,
    c.planned_amount::text AS "plannedAmount",
    COALESCE(SUM(e.amount), 0)::numeric(12,2)::text AS "spentAmount",
    (c.planned_amount - COALESCE(SUM(e.amount), 0))::numeric(12,2)::text AS "remainingAmount"
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
    `INSERT INTO categories (budget_id, name, planned_amount)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [budgetId, data.name, data.plannedAmount],
  );
  return result.rows[0].id;
}

export async function updateOwnedCategory(
  categoryId: string,
  userId: string,
  data: UpdateCategoryPayload,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE categories c SET
       name = COALESCE($3, c.name),
       planned_amount = COALESCE($4::numeric, c.planned_amount),
       updated_at = now()
     FROM budgets b
     WHERE c.id = $1 AND c.budget_id = b.id AND b.user_id = $2`,
    [categoryId, userId, data.name ?? null, data.plannedAmount ?? null],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function deleteOwnedCategory(
  categoryId: string,
  userId: string,
): Promise<"deleted" | "not_found" | "has_expenses"> {
  try {
    const result = await pool.query(
      `DELETE FROM categories c
       USING budgets b
       WHERE c.id = $1 AND c.budget_id = b.id AND b.user_id = $2
         AND NOT EXISTS (
           SELECT 1 FROM expenses e WHERE e.category_id = c.id
         )
       RETURNING c.id`,
      [categoryId, userId],
    );
    if ((result.rowCount ?? 0) > 0) {
      return "deleted";
    }
  } catch (error) {
    if (isExpenseForeignKeyViolation(error)) {
      return "has_expenses";
    }
    throw error;
  }

  const result = await pool.query<{ hasExpenses: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM expenses e WHERE e.category_id = c.id
     ) AS "hasExpenses"
     FROM categories c
     JOIN budgets b ON b.id = c.budget_id
     WHERE c.id = $1 AND b.user_id = $2`,
    [categoryId, userId],
  );
  if (!result.rows[0]) {
    return "not_found";
  }
  return result.rows[0].hasExpenses ? "has_expenses" : "not_found";
}

function isExpenseForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    error.code === "23503" &&
    error.constraint === "expenses_category_id_fkey"
  );
}
