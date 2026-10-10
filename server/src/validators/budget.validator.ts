import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Invalid date');

const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

const amountSchema = z
  .number()
  .finite('Amount must be a finite number')
  .min(0, 'Amount must not be negative')
  .max(9_999_999_999.99, 'Amount is too large');

const currencySchema = z.enum(['RUB', 'USD', 'EUR'], 'Unsupported currency');

const createSchema = z
  .object({
    name: nameSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    initialAmount: amountSchema,
    currency: currencySchema,
  })
  .strict()
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must not be before start date',
    path: ['endDate'],
  });

const updateSchema = z
  .object({
    name: nameSchema.optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
    initialAmount: amountSchema.optional(),
    currency: currencySchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must not be before start date',
    path: ['endDate'],
  });

const setActiveSchema = z.object({
  budgetId: z.string().uuid('Invalid budget id'),
});

export type CreateBudgetPayload = z.infer<typeof createSchema>;
export type UpdateBudgetPayload = z.infer<typeof updateSchema>;

export function validateCreateBudgetPayload(body: unknown): CreateBudgetPayload {
  return createSchema.parse(body);
}

export function validateUpdateBudgetPayload(body: unknown): UpdateBudgetPayload {
  return updateSchema.parse(body);
}

export function validateSetActiveBudgetPayload(body: unknown): {
  budgetId: string;
} {
  return setActiveSchema.parse(body);
}
