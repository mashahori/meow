import { describe, expect, it } from "@jest/globals";
import { ZodError } from "zod";
import {
  validateLoginPayload,
  validatePasswordResetPayload,
  validatePasswordResetRequestPayload,
  validateRegisterPayload,
} from "../../src/validators/auth.validator";

function issueFields(action: () => unknown): string[] {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
    return (error as ZodError).issues.map((issue) => String(issue.path[0]));
  }
  throw new Error("Expected validation to fail");
}

describe("validateRegisterPayload", () => {
  it("trims and lowercases the email", () => {
    expect(
      validateRegisterPayload({
        email: "  Maria@Example.com ",
        password: "password123",
      }),
    ).toEqual({ email: "maria@example.com", password: "password123" });
  });

  it("accepts a password of exactly 8 characters", () => {
    expect(
      validateRegisterPayload({ email: "a@b.co", password: "12345678" }),
    ).toEqual({ email: "a@b.co", password: "12345678" });
  });

  it("rejects an invalid email and a short password", () => {
    expect(
      issueFields(() =>
        validateRegisterPayload({ email: "not-an-email", password: "short" }),
      ).sort(),
    ).toEqual(["email", "password"]);
  });

  it("rejects a 7-character password", () => {
    expect(
      issueFields(() =>
        validateRegisterPayload({ email: "a@b.co", password: "1234567" }),
      ),
    ).toEqual(["password"]);
  });

  it.each([undefined, null, "text", 42, []])("rejects body %p", (body) => {
    expect(() => validateRegisterPayload(body)).toThrow(ZodError);
  });

  it("rejects non-string field values", () => {
    expect(
      issueFields(() =>
        validateRegisterPayload({ email: 123, password: { value: "x" } }),
      ).sort(),
    ).toEqual(["email", "password"]);
  });
});

describe("validateLoginPayload", () => {
  it("normalizes the email and keeps the password untouched", () => {
    expect(
      validateLoginPayload({ email: " USER@Example.com", password: " pass " }),
    ).toEqual({ email: "user@example.com", password: " pass " });
  });

  it("rejects an invalid email and an empty password", () => {
    expect(
      issueFields(() =>
        validateLoginPayload({ email: "invalid", password: "" }),
      ).sort(),
    ).toEqual(["email", "password"]);
  });

  it("rejects an empty body", () => {
    expect(() => validateLoginPayload({})).toThrow(ZodError);
  });
});

describe("password reset payload validation", () => {
  it("normalizes the email for a reset request", () => {
    expect(
      validatePasswordResetRequestPayload({ email: " USER@Example.com " }),
    ).toEqual({ email: "user@example.com" });
  });

  it("requires a 43-character token and a password of at least 8 characters", () => {
    expect(() =>
      validatePasswordResetPayload({
        token: "a".repeat(43),
        password: "password",
      }),
    ).not.toThrow();
    expect(() =>
      validatePasswordResetPayload({ token: "short", password: "1234567" }),
    ).toThrow(ZodError);
  });
});
