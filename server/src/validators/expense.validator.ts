import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Invalid date');

const amountSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/,
    'Amount must be greater than zero with at most two decimal places',
  )
  .refine((value) => Number(value) > 0, 'Amount must be greater than zero');

const noteSchema = z.string().trim().max(500, 'Note must be at most 500 characters');

const createSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category id'),
    amount: amountSchema,
    spentAt: dateSchema,
    note: noteSchema.optional(),
  })
  .strict();

const updateSchema = z
  .object({
    categoryId: z.string().uuid('Invalid category id').optional(),
    amount: amountSchema.optional(),
    spentAt: dateSchema.optional(),
    note: noteSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

const expenseIdSchema = z.string().uuid('Invalid expense id');
const categoryIdSchema = z.string().uuid('Invalid category id');

export type CreateExpensePayload = z.infer<typeof createSchema>;
export type UpdateExpensePayload = z.infer<typeof updateSchema>;

export function validateCreateExpensePayload(body: unknown): CreateExpensePayload {
  return createSchema.parse(body);
}

export function validateUpdateExpensePayload(body: unknown): UpdateExpensePayload {
  return updateSchema.parse(body);
}

export function validateExpenseId(value: unknown): string {
  return expenseIdSchema.parse(value);
}

export function validateExpenseCategoryId(value: unknown): string {
  return categoryIdSchema.parse(value);
}
