import { z } from "zod";

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterPayload = z.infer<typeof registerSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;

export function validateRegisterPayload(body: unknown): RegisterPayload {
  return registerSchema.parse(body);
}

export function validateLoginPayload(body: unknown): LoginPayload {
  return loginSchema.parse(body);
}
