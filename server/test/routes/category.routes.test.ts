import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { isBudgetOwnedByUser } from "../../src/repositories/budget.repository";
import { listCategoryGroups } from "../../src/repositories/category-group.repository";
import {
  type CategoryRow,
  deleteOwnedCategory,
  findCategoryInBudget,
  findOwnedCategory,
  insertCategory,
  listCategories,
  updateOwnedCategory,
} from "../../src/repositories/category.repository";
import { listExpensesByCategory, findCategoryBudget, type ExpenseRow } from "../../src/repositories/expense.repository";
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
jest.mock("../../src/repositories/category.repository");
jest.mock("../../src/repositories/category-group.repository");
jest.mock("../../src/repositories/expense.repository");
jest.mock("../../src/repositories/user.repository");

const BUDGET_ID = "3f2504e0-e89b-41d4-a716-446655440000";
const CATEGORY_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const EXPENSE_ID = "b1d2c3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e";

function categoryRow(overrides: Partial<CategoryRow> = {}): CategoryRow {
  return {
    id: CATEGORY_ID,
    budgetId: BUDGET_ID,
    name: "Food",
    groupSlug: null,
    plannedAmount: "5000",
    spentAmount: "1200",
    remainingAmount: "3800",
    ...overrides,
  };
}

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

describe("category routes", () => {
  const newClient = setupTestServer();
  let client: TestClient;

  beforeEach(async () => {
    client = newClient();
    jest.mocked(isBudgetOwnedByUser).mockResolvedValue(true);
    await signIn(client);
  });

  describe("authentication", () => {
    it.each([
      ["GET", `/api/budgets/${BUDGET_ID}/categories`],
      ["POST", `/api/budgets/${BUDGET_ID}/categories`],
      ["PATCH", `/api/categories/${CATEGORY_ID}`],
      ["DELETE", `/api/categories/${CATEGORY_ID}`],
      ["GET", `/api/categories/${CATEGORY_ID}/expenses`],
      ["GET", "/api/category-groups"],
    ])("%s %s returns 401 without a session", async (method, path) => {
      const response = await newClient().request(method, path, method === "GET" || method === "DELETE" ? undefined : {});

      expect(response.status).toBe(401);
      expect(listCategories).not.toHaveBeenCalled();
      expect(listCategoryGroups).not.toHaveBeenCalled();
      expect(updateOwnedCategory).not.toHaveBeenCalled();
      expect(deleteOwnedCategory).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/budgets/:budgetId/categories", () => {
    it("lists categories of the budget", async () => {
      jest.mocked(listCategories).mockResolvedValue([categoryRow()]);

      const response = await client.get(`/api/budgets/${BUDGET_ID}/categories`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: [categoryRow()] });
      expect(listCategories).toHaveBeenCalledWith(BUDGET_ID);
    });

    it("returns 404 for a budget the user does not own", async () => {
      jest.mocked(isBudgetOwnedByUser).mockResolvedValue(false);

      const response = await client.get(`/api/budgets/${BUDGET_ID}/categories`);

      expect(response.status).toBe(404);
      expect(listCategories).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/category-groups", () => {
    it("lists the system category groups", async () => {
      const groups = [
        { slug: "food", sortOrder: 10 },
        { slug: "eating-out", sortOrder: 20 },
      ];
      jest.mocked(listCategoryGroups).mockResolvedValue(groups);

      const response = await client.get("/api/category-groups");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: groups });
    });
  });

  describe("POST /api/budgets/:budgetId/categories", () => {
    it("creates a category in a group", async () => {
      jest.mocked(insertCategory).mockResolvedValue(CATEGORY_ID);
      jest.mocked(findCategoryInBudget).mockResolvedValue(categoryRow({ groupSlug: "food" }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
        groupSlug: "food",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(categoryRow({ groupSlug: "food" }));
      expect(insertCategory).toHaveBeenCalledWith(BUDGET_ID, {
        name: "Food",
        plannedAmount: "5000",
        groupSlug: "food",
      });
    });

    it("returns 400 when the group does not exist", async () => {
      jest.mocked(insertCategory).mockRejectedValue({
        code: "23503",
        constraint: "categories_group_slug_fkey",
      });

      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
        groupSlug: "unknown",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { code: "VALIDATION_ERROR", details: [{ field: "groupSlug" }] },
      });
    });

    it("creates a category and returns it", async () => {
      jest.mocked(insertCategory).mockResolvedValue(CATEGORY_ID);
      jest.mocked(findCategoryInBudget).mockResolvedValue(categoryRow());

      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(categoryRow());
      expect(insertCategory).toHaveBeenCalledWith(BUDGET_ID, { name: "Food", plannedAmount: "5000" });
      expect(findCategoryInBudget).toHaveBeenCalledWith(CATEGORY_ID, BUDGET_ID);
    });

    it("returns 409 when a category with the same name already exists", async () => {
      jest.mocked(insertCategory).mockRejectedValue({
        code: "23505",
        constraint: "categories_budget_id_name_key",
      });

      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
      });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({ error: { code: "CONFLICT" } });
    });

    it("returns 400 for a negative planned amount", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "-5",
      });

      expect(response.status).toBe(400);
      expect(insertCategory).not.toHaveBeenCalled();
    });

    it("returns 400 for unknown fields", async () => {
      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
        budgetId: BUDGET_ID,
      });

      expect(response.status).toBe(400);
      expect(insertCategory).not.toHaveBeenCalled();
    });

    it("returns 404 for a budget the user does not own", async () => {
      jest.mocked(isBudgetOwnedByUser).mockResolvedValue(false);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/categories`, {
        name: "Food",
        plannedAmount: "5000",
      });

      expect(response.status).toBe(404);
      expect(insertCategory).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/categories/:categoryId", () => {
    it("updates the category and returns it", async () => {
      jest.mocked(updateOwnedCategory).mockResolvedValue(true);
      jest.mocked(findOwnedCategory).mockResolvedValue(categoryRow({ name: "Groceries" }));

      const response = await client.patch(`/api/categories/${CATEGORY_ID}`, { name: "Groceries" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(categoryRow({ name: "Groceries" }));
      expect(updateOwnedCategory).toHaveBeenCalledWith(CATEGORY_ID, TEST_USER_ID, { name: "Groceries" });
    });

    it("removes the group when groupSlug is null", async () => {
      jest.mocked(updateOwnedCategory).mockResolvedValue(true);
      jest.mocked(findOwnedCategory).mockResolvedValue(categoryRow());

      const response = await client.patch(`/api/categories/${CATEGORY_ID}`, { groupSlug: null });

      expect(response.status).toBe(200);
      expect(updateOwnedCategory).toHaveBeenCalledWith(CATEGORY_ID, TEST_USER_ID, { groupSlug: null });
    });

    it("returns 404 when the category is not owned by the user", async () => {
      jest.mocked(updateOwnedCategory).mockResolvedValue(false);

      const response = await client.patch(`/api/categories/${CATEGORY_ID}`, { plannedAmount: "100" });

      expect(response.status).toBe(404);
      expect(findOwnedCategory).not.toHaveBeenCalled();
    });

    it("returns 409 when the new name is already used in the budget", async () => {
      jest.mocked(updateOwnedCategory).mockRejectedValue({
        code: "23505",
        constraint: "categories_budget_id_name_key",
      });

      const response = await client.patch(`/api/categories/${CATEGORY_ID}`, { name: "Rent" });

      expect(response.status).toBe(409);
    });

    it("returns 400 for an invalid category id", async () => {
      const response = await client.patch("/api/categories/not-a-uuid", { name: "Rent" });

      expect(response.status).toBe(400);
      expect(updateOwnedCategory).not.toHaveBeenCalled();
    });

    it("returns 400 for an empty body", async () => {
      const response = await client.patch(`/api/categories/${CATEGORY_ID}`, {});

      expect(response.status).toBe(400);
      expect(updateOwnedCategory).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/categories/:categoryId", () => {
    it("deletes the category and returns 204", async () => {
      jest.mocked(deleteOwnedCategory).mockResolvedValue(true);

      const response = await client.delete(`/api/categories/${CATEGORY_ID}`);

      expect(response.status).toBe(204);
      expect(deleteOwnedCategory).toHaveBeenCalledWith(CATEGORY_ID, TEST_USER_ID);
    });

    it("returns 404 when the category does not exist", async () => {
      jest.mocked(deleteOwnedCategory).mockResolvedValue(false);

      const response = await client.delete(`/api/categories/${CATEGORY_ID}`);

      expect(response.status).toBe(404);
    });

    it("deletes a category that still has expenses", async () => {
      jest.mocked(deleteOwnedCategory).mockResolvedValue(true);

      const response = await client.delete(`/api/categories/${CATEGORY_ID}`);

      expect(response.status).toBe(204);
    });

    it("returns 400 for an invalid category id", async () => {
      const response = await client.delete("/api/categories/123");

      expect(response.status).toBe(400);
      expect(deleteOwnedCategory).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/categories/:categoryId/expenses", () => {
    it("returns the expenses of the category", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue(BUDGET_ID);
      jest.mocked(listExpensesByCategory).mockResolvedValue([expenseRow()]);

      const response = await client.get(`/api/categories/${CATEGORY_ID}/expenses`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: [expenseRow()] });
      expect(listExpensesByCategory).toHaveBeenCalledWith(CATEGORY_ID, TEST_USER_ID);
    });

    it("returns 404 when the category is not owned by the user", async () => {
      jest.mocked(findCategoryBudget).mockResolvedValue(null);

      const response = await client.get(`/api/categories/${CATEGORY_ID}/expenses`);

      expect(response.status).toBe(404);
      expect(listExpensesByCategory).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid category id", async () => {
      const response = await client.get("/api/categories/nope/expenses");

      expect(response.status).toBe(400);
      expect(findCategoryBudget).not.toHaveBeenCalled();
    });
  });
});
