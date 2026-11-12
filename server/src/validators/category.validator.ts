import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be at most 100 characters");

const plannedAmountSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d{0,9})$/, "Planned amount must be a non-negative whole number");

// Only the format is checked here; whether the group exists is enforced by the database.
const groupSlugSchema = z
  .string()
  .max(50, "Group slug must be at most 50 characters")
  .regex(/^[a-z]+(?:-[a-z]+)*$/, "Invalid group slug")
  .nullable();

const createSchema = z
  .object({
    name: nameSchema,
    plannedAmount: plannedAmountSchema,
    groupSlug: groupSlugSchema.optional(),
  })
  .strict();

const updateSchema = z
  .object({
    name: nameSchema.optional(),
    plannedAmount: plannedAmountSchema.optional(),
    groupSlug: groupSlugSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const categoryIdSchema = z.string().uuid("Invalid category id");

export type CreateCategoryPayload = z.infer<typeof createSchema>;
export type UpdateCategoryPayload = z.infer<typeof updateSchema>;

export function validateCreateCategoryPayload(
  body: unknown,
): CreateCategoryPayload {
  return createSchema.parse(body);
}

export function validateUpdateCategoryPayload(
  body: unknown,
): UpdateCategoryPayload {
  return updateSchema.parse(body);
}

export function validateCategoryId(value: unknown): string {
  return categoryIdSchema.parse(value);
}
