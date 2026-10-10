import { z } from 'zod';
import { ApiError } from './auth-api';

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

const budgetsResponseSchema = z.object({ items: z.array(budgetSchema) });
const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type Budget = z.infer<typeof budgetSchema>;
export type CreateBudgetPayload = {
  name: string;
  startDate: string;
  endDate: string;
  initialAmount: number;
  currency: Budget['currency'];
};

const apiBaseUrl = (import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || '').replace(
  /\/+$/,
  '',
);

export async function getBudgets(): Promise<Budget[]> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/budgets`, {
      credentials: 'include',
    });
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
        : `Unable to load budgets (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    );
  }

  return budgetsResponseSchema.parse(await response.json()).items;
}

export async function createBudget(payload: CreateBudgetPayload): Promise<Budget> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/api/budgets`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
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
        : `Unable to create budget (${response.status}).`,
      response.status,
      parsedError.success ? parsedError.data.error.code : undefined,
    );
  }

  return budgetSchema.parse(await response.json());
}
