import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/app-error";
import {
  archiveBudget as archiveBudgetRecord,
  cloneBudget as cloneBudgetRecord,
  unarchiveBudget as unarchiveBudgetRecord,
  BudgetRow,
  CategorySummaryRow,
  clearActiveBudget,
  deleteBudget,
  findActiveBudget,
  findBudget,
  getBudgetStatus,
  insertBudget,
  listBudgetCategories,
  listBudgets,
  setActiveBudget,
  updateBudget,
} from "../repositories/budget.repository";
import {
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "../validators/budget.validator";

export type BudgetDetails = BudgetRow & { categories: CategorySummaryRow[] };

async function requireBudget(budgetId: string, userId: string) {
  const budget = await findBudget(budgetId, userId);
  if (!budget) {
    throw new NotFoundError("Budget not found");
  }
  return budget;
}

export function getBudgets(userId: string) {
  return listBudgets(userId);
}

export async function getBudgetDetails(
  budgetId: string,
  userId: string,
): Promise<BudgetDetails> {
  const budget = await requireBudget(budgetId, userId);
  const categories = await listBudgetCategories(budgetId);
  return { ...budget, categories };
}

export async function createBudget(
  userId: string,
  payload: CreateBudgetPayload,
): Promise<BudgetRow> {
  const id = await insertBudget(userId, payload);
  return requireBudget(id, userId);
}

export async function editBudget(
  budgetId: string,
  userId: string,
  payload: UpdateBudgetPayload,
): Promise<BudgetRow> {
  const updated = await updateBudget(budgetId, userId, payload);
  if (!updated) {
    // Either the budget vanished or the merged period is invalid.
    await requireBudget(budgetId, userId);
    throw new ValidationError([
      { field: "endDate", message: "End date must not be before start date" },
    ]);
  }
  return requireBudget(budgetId, userId);
}

export async function removeBudget(
  budgetId: string,
  userId: string,
): Promise<void> {
  await requireBudget(budgetId, userId);
  await deleteBudget(budgetId, userId);
}

export async function archiveBudget(
  budgetId: string,
  userId: string,
): Promise<BudgetRow> {
  const archived = await archiveBudgetRecord(budgetId, userId);
  if (!archived) {
    throw new NotFoundError("Budget not found");
  }
  return requireBudget(budgetId, userId);
}

export async function cloneBudget(
  budgetId: string,
  userId: string,
): Promise<BudgetRow> {
  const clonedId = await cloneBudgetRecord(budgetId, userId);
  if (!clonedId) {
    throw new NotFoundError("Budget not found");
  }
  return requireBudget(clonedId, userId);
}

export async function unarchiveBudget(
  budgetId: string,
  userId: string,
): Promise<BudgetRow> {
  const unarchived = await unarchiveBudgetRecord(budgetId, userId);
  if (!unarchived) {
    throw new NotFoundError("Budget not found");
  }
  return requireBudget(budgetId, userId);
}

export async function deactivateBudget(
  budgetId: string,
  userId: string,
): Promise<BudgetRow> {
  await requireBudget(budgetId, userId);
  await clearActiveBudget(userId, budgetId);
  return requireBudget(budgetId, userId);
}

export async function getActiveBudget(
  userId: string,
): Promise<BudgetRow | null> {
  return findActiveBudget(userId);
}

export async function activateBudget(
  budgetId: string,
  userId: string,
): Promise<BudgetRow> {
  const status = await getBudgetStatus(budgetId, userId);
  if (!status) {
    throw new NotFoundError("Budget not found");
  }
  if (status === "archived") {
    throw new ConflictError("Archived budget cannot be active");
  }
  await setActiveBudget(userId, budgetId);
  return requireBudget(budgetId, userId);
}
