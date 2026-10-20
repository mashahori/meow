import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
});

const passwordResetSchema = z.object({
  token: z.string().length(43, "Invalid reset token"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
export type PasswordResetRequestPayload = z.infer<
  typeof passwordResetRequestSchema
>;
export type PasswordResetPayload = z.infer<typeof passwordResetSchema>;

export function validateRegisterPayload(body: unknown): RegisterPayload {
  return registerSchema.parse(body);
}

export function validateLoginPayload(body: unknown): LoginPayload {
  return loginSchema.parse(body);
}

export function validatePasswordResetRequestPayload(
  body: unknown,
): PasswordResetRequestPayload {
  return passwordResetRequestSchema.parse(body);
}

export function validatePasswordResetPayload(
  body: unknown,
): PasswordResetPayload {
  return passwordResetSchema.parse(body);
}
