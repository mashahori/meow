import { describe, expect, it } from "@jest/globals";
import {
  validateCategoryId,
  validateCreateCategoryPayload,
  validateUpdateCategoryPayload,
} from "../../src/validators/category.validator";

describe("category validators", () => {
  it("trims category names and accepts whole-number amounts", () => {
    expect(
      validateCreateCategoryPayload({
        name: "  Groceries  ",
        plannedAmount: "26000",
      }),
    ).toEqual({ name: "Groceries", plannedAmount: "26000" });
  });

  it.each([
    { name: "", plannedAmount: "100" },
    { name: "Groceries", plannedAmount: "-1" },
    { name: "Groceries", plannedAmount: "1.01" },
    { name: "Groceries", plannedAmount: 100 },
    { name: "Groceries", plannedAmount: "10000000000" },
    { name: "Groceries", plannedAmount: "0", extra: true },
  ])("rejects invalid create payload %#", (body) => {
    expect(() => validateCreateCategoryPayload(body)).toThrow();
  });

  it("requires at least one valid field for updates", () => {
    expect(() => validateUpdateCategoryPayload({})).toThrow();
    expect(() => validateUpdateCategoryPayload({ name: " " })).toThrow();
    expect(validateUpdateCategoryPayload({ plannedAmount: "0" })).toEqual({
      plannedAmount: "0",
    });
  });

  it("validates category UUIDs", () => {
    expect(
      validateCategoryId("3f2504e0-e89b-41d4-a716-446655440000"),
    ).toBe("3f2504e0-e89b-41d4-a716-446655440000");
    expect(() => validateCategoryId("invalid")).toThrow();
  });
});
