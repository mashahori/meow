import { z } from 'zod';
import { requestJson, requestVoid } from './api-client';

const expenseSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.string(),
  spentAt: z.string().date(),
  note: z.string().nullable(),
});

const expensesResponseSchema = z.object({ items: z.array(expenseSchema) });

export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpensePayload = {
  categoryId: string;
  amount: string;
  spentAt: string;
  note?: string;
};
export type UpdateExpensePayload = {
  amount: string;
  spentAt: string;
  note: string | null;
};

function jsonRequest(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function getCategoryExpenses(categoryId: string, signal?: AbortSignal): Promise<Expense[]> {
  return requestJson(
    `/api/categories/${categoryId}/expenses`,
    expensesResponseSchema,
    'Unable to load category expenses',
    { signal },
  ).then(({ items }) => items);
}

export function createExpense(budgetId: string, payload: CreateExpensePayload): Promise<Expense> {
  return requestJson(
    `/api/budgets/${budgetId}/expenses`,
    expenseSchema,
    'Unable to create expense',
    jsonRequest('POST', payload),
  );
}

export function updateExpense(expenseId: string, payload: UpdateExpensePayload): Promise<Expense> {
  return requestJson(
    `/api/expenses/${expenseId}`,
    expenseSchema,
    'Unable to update expense',
    jsonRequest('PATCH', payload),
  );
}

export function deleteExpense(expenseId: string): Promise<void> {
  return requestVoid(`/api/expenses/${expenseId}`, 'Unable to delete expense', {
    method: 'DELETE',
  });
}
