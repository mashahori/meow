import { z } from 'zod';
import { ApiError } from './auth-api';

const expenseSchema = z.object({
  id: z.string().uuid(),
  budgetId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z.string(),
  spentAt: z.string().date(),
  note: z.string().nullable(),
});

const expensesResponseSchema = z.object({ items: z.array(expenseSchema) });
const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

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

const apiBaseUrl = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || '').replace(
  /\/+$/,
  '',
);

export async function getCategoryExpenses(categoryId: string): Promise<Expense[]> {
  const response = await expenseRequest(
    `/api/categories/${categoryId}/expenses`,
    { credentials: 'include' },
    'Unable to load category expenses',
  );
  return expensesResponseSchema.parse(await response.json()).items;
}

export async function createExpense(
  budgetId: string,
  payload: CreateExpensePayload,
): Promise<Expense> {
  const response = await expenseRequest(
    `/api/budgets/${budgetId}/expenses`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Unable to create expense',
  );
  return expenseSchema.parse(await response.json());
}

export async function updateExpense(
  expenseId: string,
  payload: UpdateExpensePayload,
): Promise<Expense> {
  const response = await expenseRequest(
    `/api/expenses/${expenseId}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Unable to update expense',
  );
  return expenseSchema.parse(await response.json());
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await expenseRequest(
    `/api/expenses/${expenseId}`,
    { method: 'DELETE', credentials: 'include' },
    'Unable to delete expense',
  );
}

async function expenseRequest(
  path: string,
  init: RequestInit,
  errorMessage: string,
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, init);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError('Unable to connect to the server. Please check that it is available.', 0);
    }
    throw error;
  }

  if (!response.ok) {
    const payload: unknown = await response.json();
    const parsedError = apiErrorSchema.safeParse(payload);
    throw new ApiError(
      parsedError.success
        ? parsedError.data.error.message
        : `${errorMessage} (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    );
  }

  return response;
}
