import { pool } from "../db/pool";

export type CategoryGroupRow = {
  slug: string;
  sortOrder: number;
};

export async function listCategoryGroups(): Promise<CategoryGroupRow[]> {
  const result = await pool.query<CategoryGroupRow>(
    `SELECT slug, sort_order AS "sortOrder"
     FROM category_groups
     ORDER BY sort_order`,
  );
  return result.rows;
}
