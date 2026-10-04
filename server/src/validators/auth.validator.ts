import { ValidationError, ValidationErrorDetail } from "../errors/app-error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export type RegisterPayload = {
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function validateRegisterPayload(body: unknown): RegisterPayload {
  const data = (body ?? {}) as Record<string, unknown>;
  const errors: ValidationErrorDetail[] = [];

  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push({ field: "email", message: "Invalid email" });
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: "password",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return { email, password };
}

export function validateLoginPayload(body: unknown): LoginPayload {
  const data = (body ?? {}) as Record<string, unknown>;
  const errors: ValidationErrorDetail[] = [];

  const email =
    typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push({ field: "email", message: "Invalid email" });
  }

  if (!password) {
    errors.push({ field: "password", message: "Password is required" });
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  return { email, password };
}
