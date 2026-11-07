import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { isBudgetOwnedByUser } from "../../src/repositories/budget.repository";
import {
  deleteOwnedExpense,
  type ExpenseRow,
  findBudgetPeriod,
  findCategoryBudget,
  findOwnedExpense,
  insertExpense,
  listExpenses,
  updateOwnedExpense,
} from "../../src/repositories/expense.repository";
import { setupTestServer, signIn, TEST_USER_ID, TestClient } from "./route-helpers";

jest.mock("../../src/config/session", () => {
  const session = jest.requireActual("express-session") as typeof import("express-session");
  return {
    sessionMiddleware: session({
      name: "sid",
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  };
});

jest.mock("../../src/repositories/budget.repository");
jest.mock("../../src/repositories/expense.repository");
jest.mock("../../src/repositories/user.repository");

const BUDGET_ID = "3f2504e0-e89b-41d4-a716-446655440000";
const CATEGORY_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const OTHER_CATEGORY_ID = "0a1b2c3d-4e5f-4a6b-9c8d-7e6f5a4b3c2d";
const EXPENSE_ID = "b1d2c3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e";

const PERIOD = { startDate: "2026-06-01", endDate: "2026-06-30" };

function expenseRow(overrides: Partial<ExpenseRow> = {}): ExpenseRow {
  return {
    id: EXPENSE_ID,
    budgetId: BUDGET_ID,
    categoryId: CATEGORY_ID,
    amount: "300",
    spentAt: "2026-06-10",
    note: null,
    ...overrides,
  };
}

const validCreatePayload = {
  categoryId: CATEGORY_ID,
  amount: "300",
  spentAt: "2026-06-10",
  note: "Lunch",
};

describe("expense routes", () => {
  const newClient = setupTestServer();
  let client: TestClient;

  beforeEach(async () => {
    client = newClient();
    jest.mocked(isBudgetOwnedByUser).mockResolvedValue(true);
    await signIn(client);
  });

  describe("authentication", () => {
    it.each([
      ["POST", `/api/budgets/${BUDGET_ID}/expenses`],
      ["PATCH", `/api/expenses/${EXPENSE_ID}`],
      ["DELETE", `/api/expenses/${EXPENSE_ID}`],
    ])("%s %s returns 401 without a session", async (method, path) => {
      const response = await newClient().request(method, path, method === "DELETE" ? undefined : {});

      expect(response.status).toBe(401);
      expect(insertExpense).not.toHaveBeenCalled();
      expect(updateOwnedExpense).not.toHaveBeenCalled();
      expect(deleteOwnedExpense).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/budgets/:budgetId/expenses", () => {
    it("lists expenses of the budget", async () => {
      jest.mocked(listExpenses).mockResolvedValue([expenseRow()]);

      const response = await client.get(`/api/budgets/${BUDGET_ID}/expenses`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: [expenseRow()] });
      expect(listExpenses).toHaveBeenCalledWith(BUDGET_ID);
    });

    it("returns 404 for a budget the user does not own", async () => {
      jest.mocked(isBudgetOwnedByUser).mockResolvedValue(false);

      const response = await client.get(`/api/budgets/${BUDGET_ID}/expenses`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/budgets/:budgetId/expenses", () => {
    beforeEach(() => {
      jest.mocked(findCategoryBudget).mockResolvedValue(BUDGET_ID);
      jest.mocked(findBudgetPeriod).mockResolvedValue(PERIOD);
    });

    it("creates an expense and returns it", async () => {
      jest.mocked(insertExpense).mockResolvedValue(EXPENSE_ID);
      jest.mocked(findOwnedExpense).mockResolvedValue(expenseRow({ note: "Lunch" }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, validCreatePayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expenseRow({ note: "Lunch" }));
      expect(findCategoryBudget).toHaveBeenCalledWith(CATEGORY_ID, TEST_USER_ID);
      expect(findBudgetPeriod).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
      expect(insertExpense).toHaveBeenCalledWith(BUDGET_ID, validCreatePayload);
    });

    it("accepts a request without a note", async () => {
      jest.mocked(insertExpense).mockResolvedValue(EXPENSE_ID);
      jest.mocked(findOwnedExpense).mockResolvedValue(expenseRow());

      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, {
        categoryId: CATEGORY_ID,
        amount: "300",
        spentAt: "2026-06-10",
      });

      expect(response.status).toBe(201);
    });

    it("returns 404 when the category belongs to another budget", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue("another-budget");

      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, validCreatePayload);

      expect(response.status).toBe(404);
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 404 when the category does not exist", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue(null);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, validCreatePayload);

      expect(response.status).toBe(404);
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 400 when spentAt is outside the budget period", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, {
        ...validCreatePayload,
        spentAt: "2026-07-01",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { details: [{ field: "spentAt" }] },
      });
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 400 for a zero amount", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, {
        ...validCreatePayload,
        amount: "0",
      });

      expect(response.status).toBe(400);
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid date format", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, {
        ...validCreatePayload,
        spentAt: "10.06.2026",
      });

      expect(response.status).toBe(400);
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 400 for a note longer than 500 characters", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, {
        ...validCreatePayload,
        note: "a".repeat(501),
      });

      expect(response.status).toBe(400);
      expect(insertExpense).not.toHaveBeenCalled();
    });

    it("returns 404 for a budget the user does not own", async () => {
      jest.mocked(isBudgetOwnedByUser).mockResolvedValue(false);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/expenses`, validCreatePayload);

      expect(response.status).toBe(404);
      expect(insertExpense).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/expenses/:expenseId", () => {
    beforeEach(() => {
      jest.mocked(findOwnedExpense).mockResolvedValue(expenseRow());
      jest.mocked(findCategoryBudget).mockResolvedValue(BUDGET_ID);
      jest.mocked(findBudgetPeriod).mockResolvedValue(PERIOD);
    });

    it("updates the expense and returns it", async () => {
      jest.mocked(updateOwnedExpense).mockResolvedValue(true);
      jest.mocked(findOwnedExpense)
        .mockResolvedValueOnce(expenseRow())
        .mockResolvedValueOnce(expenseRow({ amount: "450" }));

      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, { amount: "450" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(expenseRow({ amount: "450" }));
      expect(updateOwnedExpense).toHaveBeenCalledWith(EXPENSE_ID, TEST_USER_ID, { amount: "450" });
    });

    it("checks the new category against the expense budget", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue(BUDGET_ID);
      jest.mocked(updateOwnedExpense).mockResolvedValue(true);

      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, {
        categoryId: OTHER_CATEGORY_ID,
      });

      expect(response.status).toBe(200);
      expect(findCategoryBudget).toHaveBeenCalledWith(OTHER_CATEGORY_ID, TEST_USER_ID);
    });

    it("returns 404 when the new category belongs to another budget", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue("another-budget");

      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, {
        categoryId: OTHER_CATEGORY_ID,
      });

      expect(response.status).toBe(404);
      expect(updateOwnedExpense).not.toHaveBeenCalled();
    });

    it("returns 400 when the new date is outside the budget period", async () => {
      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, { spentAt: "2025-12-31" });

      expect(response.status).toBe(400);
      expect(updateOwnedExpense).not.toHaveBeenCalled();
    });

    it("clears the note when null is passed", async () => {
      jest.mocked(updateOwnedExpense).mockResolvedValue(true);

      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, { note: null });

      expect(response.status).toBe(200);
      expect(updateOwnedExpense).toHaveBeenCalledWith(EXPENSE_ID, TEST_USER_ID, { note: null });
    });

    it("returns 404 when the expense is not owned by the user", async () => {
      jest.mocked(findOwnedExpense).mockResolvedValue(null);

      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, { amount: "450" });

      expect(response.status).toBe(404);
      expect(updateOwnedExpense).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid expense id", async () => {
      const response = await client.patch("/api/expenses/not-a-uuid", { amount: "450" });

      expect(response.status).toBe(400);
      expect(findOwnedExpense).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty body", async () => {
      const response = await client.patch(`/api/expenses/${EXPENSE_ID}`, {});

      expect(response.status).toBe(400);
      expect(updateOwnedExpense).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/expenses/:expenseId", () => {
    it("deletes the expense and returns 204", async () => {
      jest.mocked(deleteOwnedExpense).mockResolvedValue(true);

      const response = await client.delete(`/api/expenses/${EXPENSE_ID}`);

      expect(response.status).toBe(204);
      expect(deleteOwnedExpense).toHaveBeenCalledWith(EXPENSE_ID, TEST_USER_ID);
    });

    it("returns 404 when the expense is not owned by the user", async () => {
      jest.mocked(deleteOwnedExpense).mockResolvedValue(false);

      const response = await client.delete(`/api/expenses/${EXPENSE_ID}`);

      expect(response.status).toBe(404);
    });

    it("returns 400 for an invalid expense id", async () => {
      const response = await client.delete("/api/expenses/123");

      expect(response.status).toBe(400);
      expect(deleteOwnedExpense).not.toHaveBeenCalled();
    });
  });
});
