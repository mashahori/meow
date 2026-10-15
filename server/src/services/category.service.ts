import {
  ConflictError,
  NotFoundError,
} from "../errors/app-error";
import {
  CategoryRow,
  deleteOwnedCategory,
  findCategoryInBudget,
  findOwnedCategory,
  insertCategory,
  listCategories,
  updateOwnedCategory,
} from "../repositories/category.repository";
import {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "../validators/category.validator";

export function getCategories(budgetId: string): Promise<CategoryRow[]> {
  return listCategories(budgetId);
}

export async function createCategory(
  budgetId: string,
  payload: CreateCategoryPayload,
): Promise<CategoryRow> {
  let id: string;
  try {
    id = await insertCategory(budgetId, payload);
  } catch (error) {
    if (isCategoryNameConflict(error)) {
      throw new ConflictError("A category with this name already exists");
    }
    throw error;
  }

  const category = await findCategoryInBudget(id, budgetId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
}

export async function editCategory(
  categoryId: string,
  userId: string,
  payload: UpdateCategoryPayload,
): Promise<CategoryRow> {
  try {
    const updated = await updateOwnedCategory(categoryId, userId, payload);
    if (!updated) {
      throw new NotFoundError("Category not found");
    }
  } catch (error) {
    if (isCategoryNameConflict(error)) {
      throw new ConflictError("A category with this name already exists");
    }
    throw error;
  }

  const category = await findOwnedCategory(categoryId, userId);
  if (!category) {
    throw new NotFoundError("Category not found");
  }
  return category;
}

export async function removeCategory(
  categoryId: string,
  userId: string,
): Promise<void> {
  const result = await deleteOwnedCategory(categoryId, userId);
  if (result === "not_found") {
    throw new NotFoundError("Category not found");
  }
  if (result === "has_expenses") {
    throw new ConflictError(
      "Category has expenses and cannot be deleted",
    );
  }
}

function isCategoryNameConflict(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    error.code === "23505" &&
    error.constraint === "categories_budget_id_name_key"
  );
}
