import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../src/errors/app-error";
import { requireBudgetOwner } from "../../src/middleware/require-budget-owner";
import { isBudgetOwnedByUser } from "../../src/repositories/budget.repository";
import { createNext, createRequest, createResponse } from "../helpers";

jest.mock("../../src/repositories/budget.repository");

const mockedIsOwned = jest.mocked(isBudgetOwnedByUser);
const BUDGET_ID = "3f2504e0-e89b-41d4-a716-446655440000";

async function run(session: Record<string, unknown>, budgetId: string) {
  const next = createNext();
  const req = createRequest({ session, params: { budgetId } });
  await requireBudgetOwner(req, createResponse(), next);
  return next;
}

describe("requireBudgetOwner", () => {
  beforeEach(() => {
    mockedIsOwned.mockReset();
  });

  it("calls next without an error for the owner", async () => {
    mockedIsOwned.mockResolvedValue(true);

    const next = await run({ userId: "user-1" }, BUDGET_ID);

    expect(mockedIsOwned).toHaveBeenCalledWith(BUDGET_ID, "user-1");
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it("returns 404 for a budget owned by another user or missing", async () => {
    mockedIsOwned.mockResolvedValue(false);

    const next = await run({ userId: "user-2" }, BUDGET_ID);

    const error = next.mock.calls[0][0] as NotFoundError;
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Budget not found");
  });

  it("returns 401 without querying when unauthenticated", async () => {
    const next = await run({}, BUDGET_ID);

    expect(next.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(mockedIsOwned).not.toHaveBeenCalled();
  });

  it.each(["not-a-uuid", "", "123"])(
    "returns 400 without querying for budgetId %p",
    async (budgetId) => {
      const next = await run({ userId: "user-1" }, budgetId);

      const error = next.mock.calls[0][0] as ValidationError;
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.details?.[0].field).toBe("budgetId");
      expect(mockedIsOwned).not.toHaveBeenCalled();
    },
  );
});
