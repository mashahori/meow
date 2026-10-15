import { NotFoundError, ValidationError } from '../errors/app-error';
import {
  deleteOwnedExpense,
  ExpenseRow,
  findBudgetPeriod,
  findCategoryBudget,
  findOwnedExpense,
  insertExpense,
  listExpenses,
  listExpensesByCategory,
  updateOwnedExpense,
} from '../repositories/expense.repository';
import { CreateExpensePayload, UpdateExpensePayload } from '../validators/expense.validator';

export function getExpenses(budgetId: string): Promise<ExpenseRow[]> {
  return listExpenses(budgetId);
}

export async function getCategoryExpenses(
  categoryId: string,
  userId: string,
): Promise<ExpenseRow[]> {
  if (!(await findCategoryBudget(categoryId, userId))) {
    throw new NotFoundError('Category not found');
  }
  return listExpensesByCategory(categoryId, userId);
}

export async function createExpense(
  budgetId: string,
  userId: string,
  payload: CreateExpensePayload,
): Promise<ExpenseRow> {
  const categoryBudgetId = await findCategoryBudget(payload.categoryId, userId);
  if (categoryBudgetId !== budgetId) {
    throw new NotFoundError('Category not found');
  }
  await validateSpentAt(budgetId, userId, payload.spentAt);
  const id = await insertExpense(budgetId, payload);
  const expense = await findOwnedExpense(id, userId);
  if (!expense) {
    throw new NotFoundError('Expense not found');
  }
  return expense;
}

export async function editExpense(
  expenseId: string,
  userId: string,
  payload: UpdateExpensePayload,
): Promise<ExpenseRow> {
  const existing = await findOwnedExpense(expenseId, userId);
  if (!existing) {
    throw new NotFoundError('Expense not found');
  }

  const categoryId = payload.categoryId ?? existing.categoryId;
  const categoryBudgetId = await findCategoryBudget(categoryId, userId);
  if (categoryBudgetId !== existing.budgetId) {
    throw new NotFoundError('Category not found');
  }
  await validateSpentAt(existing.budgetId, userId, payload.spentAt ?? existing.spentAt);

  await updateOwnedExpense(expenseId, userId, payload);
  const expense = await findOwnedExpense(expenseId, userId);
  if (!expense) {
    throw new NotFoundError('Expense not found');
  }
  return expense;
}

export async function removeExpense(expenseId: string, userId: string): Promise<void> {
  if (!(await deleteOwnedExpense(expenseId, userId))) {
    throw new NotFoundError('Expense not found');
  }
}

async function validateSpentAt(budgetId: string, userId: string, spentAt: string): Promise<void> {
  const period = await findBudgetPeriod(budgetId, userId);
  if (!period) {
    throw new NotFoundError('Budget not found');
  }
  if (spentAt < period.startDate || spentAt > period.endDate) {
    throw new ValidationError([
      { field: 'spentAt', message: 'Date must be within the budget period' },
    ]);
  }
}
