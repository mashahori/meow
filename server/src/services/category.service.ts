import {
  ConflictError,
  NotFoundError,
  ValidationError,
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
    throw toCategoryWriteError(error);
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
  let updated: boolean;
  try {
    updated = await updateOwnedCategory(categoryId, userId, payload);
  } catch (error) {
    throw toCategoryWriteError(error);
  }
  if (!updated) {
    throw new NotFoundError("Category not found");
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
  const deleted = await deleteOwnedCategory(categoryId, userId);
  if (!deleted) {
    throw new NotFoundError("Category not found");
  }
}

function toCategoryWriteError(error: unknown): unknown {
  if (isConstraintViolation(error, "23505", "categories_budget_id_name_key")) {
    return new ConflictError("A category with this name already exists");
  }
  if (isConstraintViolation(error, "23503", "categories_group_slug_fkey")) {
    return new ValidationError([
      { field: "groupSlug", message: "Unknown category group" },
    ]);
  }
  return error;
}

function isConstraintViolation(
  error: unknown,
  code: string,
  constraint: string,
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "constraint" in error &&
    error.code === code &&
    error.constraint === constraint
  );
}
