import { z } from 'zod';
import { requestJson, requestVoid } from './api-client';

const budgetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  startDate: z.string().date(),
  endDate: z.string().date(),
  status: z.enum(['active', 'archived']),
  initialAmount: z.string(),
  currency: z.enum(['RUB', 'USD', 'EUR']),
  plannedAmount: z.string(),
  spentAmount: z.string(),
  remainingAmount: z.string(),
  isActive: z.boolean(),
});

const budgetCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  plannedAmount: z.string(),
  spentAmount: z.string(),
});

const categorySchema = budgetCategorySchema.extend({
  budgetId: z.string().uuid(),
  remainingAmount: z.string(),
});

const budgetDetailsSchema = budgetSchema.extend({
  categories: z.array(budgetCategorySchema),
});

const budgetsResponseSchema = z.object({ items: z.array(budgetSchema) });

export type Budget = z.infer<typeof budgetSchema>;
export type BudgetDetails = z.infer<typeof budgetDetailsSchema>;
export type BudgetCategory = z.infer<typeof budgetCategorySchema>;
export type Category = z.infer<typeof categorySchema>;
export type CategoryPayload = {
  name: string;
  plannedAmount: string;
};
export type CreateBudgetPayload = {
  name: string;
  startDate: string;
  endDate: string;
  initialAmount: number;
  currency: Budget['currency'];
};
export type UpdateBudgetPayload = CreateBudgetPayload;

function postJson(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function patchJson(body: unknown): RequestInit {
  return {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function getBudgets(signal?: AbortSignal): Promise<Budget[]> {
  return requestJson('/api/budgets', budgetsResponseSchema, 'Unable to load budgets', {
    signal,
  }).then(({ items }) => items);
}

export function getBudgetDetails(budgetId: string, signal?: AbortSignal): Promise<BudgetDetails> {
  return requestJson(`/api/budgets/${budgetId}`, budgetDetailsSchema, 'Unable to load budget', {
    signal,
  });
}

export function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  return requestJson('/api/budgets', budgetSchema, 'Unable to create budget', postJson(payload));
}

export function updateBudget(budgetId: string, payload: UpdateBudgetPayload): Promise<Budget> {
  return requestJson(
    `/api/budgets/${budgetId}`,
    budgetSchema,
    'Unable to update budget',
    patchJson(payload),
  );
}

export function deleteBudget(budgetId: string): Promise<void> {
  return requestVoid(`/api/budgets/${budgetId}`, 'Unable to delete budget', {
    method: 'DELETE',
  });
}

export function createCategory(budgetId: string, payload: CategoryPayload): Promise<Category> {
  return requestJson(
    `/api/budgets/${budgetId}/categories`,
    categorySchema,
    'Unable to create category',
    postJson(payload),
  );
}

export function updateCategory(categoryId: string, payload: CategoryPayload): Promise<Category> {
  return requestJson(
    `/api/categories/${categoryId}`,
    categorySchema,
    'Unable to update category',
    patchJson(payload),
  );
}

export function deleteCategory(categoryId: string): Promise<void> {
  return requestVoid(`/api/categories/${categoryId}`, 'Unable to delete category', {
    method: 'DELETE',
  });
}
