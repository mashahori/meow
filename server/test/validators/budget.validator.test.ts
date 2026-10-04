import { describe, expect, it } from "@jest/globals";
import {
  validateCreateBudgetPayload,
  validateUpdateBudgetPayload,
} from "../../src/validators/budget.validator";

describe("budget validators", () => {
  it("accepts a valid create payload and trims the name", () => {
    expect(
      validateCreateBudgetPayload({
        name: "  June  ",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
      }),
    ).toEqual({ name: "June", startDate: "2026-06-01", endDate: "2026-06-30" });
  });

  it.each([
    { name: "", startDate: "2026-06-01", endDate: "2026-06-30" },
    { name: "x", startDate: "2026-06-31", endDate: "2026-07-01" },
    { name: "x", startDate: "2026-06-10", endDate: "2026-06-01" },
  ])("rejects invalid create payload %#", (body) => {
    expect(() => validateCreateBudgetPayload(body)).toThrow();
  });

  it("requires at least one field on update and rejects unknown ones", () => {
    expect(() => validateUpdateBudgetPayload({})).toThrow();
    expect(() => validateUpdateBudgetPayload({ status: "archived" })).toThrow();
    expect(validateUpdateBudgetPayload({ name: "New" })).toEqual({ name: "New" });
  });
});
