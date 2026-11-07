import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  archiveBudget,
  cloneBudget,
  type BudgetRow,
  clearActiveBudget,
  deleteBudget,
  findActiveBudget,
  findBudget,
  getBudgetStatus,
  insertBudget,
  isBudgetOwnedByUser,
  listBudgetCategories,
  listBudgets,
  setActiveBudget,
  unarchiveBudget,
  updateBudget,
} from "../../src/repositories/budget.repository";
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
jest.mock("../../src/repositories/user.repository");

const BUDGET_ID = "3f2504e0-e89b-41d4-a716-446655440000";

function budgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: BUDGET_ID,
    name: "June",
    startDate: "2026-06-01",
    endDate: "2026-06-30",
    status: "active",
    initialAmount: "26000.00",
    currency: "RUB",
    plannedAmount: "0",
    spentAmount: "0",
    remainingAmount: "0",
    isActive: false,
    ...overrides,
  };
}

const validCreatePayload = {
  name: "June",
  startDate: "2026-06-01",
  endDate: "2026-06-30",
  initialAmount: 26000,
  currency: "RUB",
};

describe("budget routes", () => {
  const newClient = setupTestServer();
  let client: TestClient;

  beforeEach(async () => {
    client = newClient();
    jest.mocked(isBudgetOwnedByUser).mockResolvedValue(true);
    await signIn(client);
  });

  describe("authentication", () => {
    it.each([
      ["GET", "/api/budgets"],
      ["POST", "/api/budgets"],
      ["GET", "/api/budgets/active"],
      ["PUT", "/api/budgets/active"],
      ["GET", `/api/budgets/${BUDGET_ID}`],
      ["PATCH", `/api/budgets/${BUDGET_ID}`],
      ["DELETE", `/api/budgets/${BUDGET_ID}`],
      ["POST", `/api/budgets/${BUDGET_ID}/activate`],
      ["POST", `/api/budgets/${BUDGET_ID}/deactivate`],
      ["POST", `/api/budgets/${BUDGET_ID}/archive`],
      ["POST", `/api/budgets/${BUDGET_ID}/unarchive`],
      ["POST", `/api/budgets/${BUDGET_ID}/clone`],
    ])("%s %s returns 401 without a session", async (method, path) => {
      const response = await newClient().request(method, path, method === "GET" ? undefined : {});

      expect(response.status).toBe(401);
      expect(isBudgetOwnedByUser).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/budgets", () => {
    it("lists the budgets of the current user", async () => {
      jest.mocked(listBudgets).mockResolvedValue([budgetRow()]);

      const response = await client.get("/api/budgets");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ items: [budgetRow()] });
      expect(listBudgets).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe("POST /api/budgets", () => {
    it("creates a budget without changing the active budgets", async () => {
      jest.mocked(insertBudget).mockResolvedValue(BUDGET_ID);
      jest.mocked(findBudget).mockResolvedValue(budgetRow());

      const response = await client.post("/api/budgets", validCreatePayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(budgetRow());
      expect(insertBudget).toHaveBeenCalledWith(TEST_USER_ID, validCreatePayload);
      expect(setActiveBudget).not.toHaveBeenCalled();
    });

    it("returns 400 when the end date is before the start date", async () => {
      const response = await client.post("/api/budgets", {
        ...validCreatePayload,
        endDate: "2026-05-01",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { details: [{ field: "endDate" }] },
      });
      expect(insertBudget).not.toHaveBeenCalled();
    });

    it("returns 400 for unsupported currency or unknown fields", async () => {
      const response = await client.post("/api/budgets", {
        ...validCreatePayload,
        currency: "GBP",
        extra: true,
      });

      expect(response.status).toBe(400);
      expect(insertBudget).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/budgets/active", () => {
    it("returns the active budget", async () => {
      jest.mocked(findActiveBudget).mockResolvedValue(budgetRow({ isActive: true }));

      const response = await client.get("/api/budgets/active");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ budget: budgetRow({ isActive: true }) });
    });

    it("returns null when there is no active budget", async () => {
      jest.mocked(findActiveBudget).mockResolvedValue(null);

      const response = await client.get("/api/budgets/active");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ budget: null });
    });
  });

  describe("PUT /api/budgets/active", () => {
    it("sets the active budget", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue("active");
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ isActive: true }));

      const response = await client.put("/api/budgets/active", { budgetId: BUDGET_ID });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ isActive: true }));
      expect(setActiveBudget).toHaveBeenCalledWith(TEST_USER_ID, BUDGET_ID);
    });

    it("returns 404 when the budget is not found", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue(null);

      const response = await client.put("/api/budgets/active", { budgetId: BUDGET_ID });

      expect(response.status).toBe(404);
      expect(setActiveBudget).not.toHaveBeenCalled();
    });

    it("returns 409 when the budget is archived", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue("archived");

      const response = await client.put("/api/budgets/active", { budgetId: BUDGET_ID });

      expect(response.status).toBe(409);
      expect(setActiveBudget).not.toHaveBeenCalled();
    });

    it("returns 400 for an invalid budget id", async () => {
      const response = await client.put("/api/budgets/active", { budgetId: "nope" });

      expect(response.status).toBe(400);
      expect(getBudgetStatus).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/budgets/:budgetId", () => {
    it("returns the budget with its category summaries", async () => {
      const categories = [{ id: "c1", name: "Food", plannedAmount: "5000", spentAmount: "1200" }];
      jest.mocked(findBudget).mockResolvedValue(budgetRow());
      jest.mocked(listBudgetCategories).mockResolvedValue(categories);

      const response = await client.get(`/api/budgets/${BUDGET_ID}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ...budgetRow(), categories });
      expect(isBudgetOwnedByUser).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
    });

    it("returns 404 when the budget is not owned by the user", async () => {
      jest.mocked(isBudgetOwnedByUser).mockResolvedValue(false);

      const response = await client.get(`/api/budgets/${BUDGET_ID}`);

      expect(response.status).toBe(404);
      expect(findBudget).not.toHaveBeenCalled();
    });

    it("returns 400 for a malformed budget id", async () => {
      const response = await client.get("/api/budgets/not-a-uuid");

      expect(response.status).toBe(400);
      expect(isBudgetOwnedByUser).not.toHaveBeenCalled();
    });
  });

  describe("PATCH /api/budgets/:budgetId", () => {
    it("updates the budget and returns it", async () => {
      jest.mocked(updateBudget).mockResolvedValue(true);
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ name: "Renamed" }));

      const response = await client.patch(`/api/budgets/${BUDGET_ID}`, { name: "Renamed" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ name: "Renamed" }));
      expect(updateBudget).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID, { name: "Renamed" });
    });

    it("returns 400 when the merged period is invalid", async () => {
      jest.mocked(updateBudget).mockResolvedValue(false);
      jest.mocked(findBudget).mockResolvedValue(budgetRow());

      const response = await client.patch(`/api/budgets/${BUDGET_ID}`, { endDate: "2026-05-01" });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        error: { details: [{ field: "endDate" }] },
      });
    });

    it("returns 404 when the budget disappears during the update", async () => {
      jest.mocked(updateBudget).mockResolvedValue(false);
      jest.mocked(findBudget).mockResolvedValue(null);

      const response = await client.patch(`/api/budgets/${BUDGET_ID}`, { name: "Renamed" });

      expect(response.status).toBe(404);
    });

    it("returns 400 for an empty body", async () => {
      const response = await client.patch(`/api/budgets/${BUDGET_ID}`, {});

      expect(response.status).toBe(400);
      expect(updateBudget).not.toHaveBeenCalled();
    });
  });

  describe("DELETE /api/budgets/:budgetId", () => {
    it("deletes the budget and returns 204", async () => {
      jest.mocked(findBudget).mockResolvedValue(budgetRow());

      const response = await client.delete(`/api/budgets/${BUDGET_ID}`);

      expect(response.status).toBe(204);
      expect(deleteBudget).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
    });

    it("returns 404 without deleting when the budget is missing", async () => {
      jest.mocked(findBudget).mockResolvedValue(null);

      const response = await client.delete(`/api/budgets/${BUDGET_ID}`);

      expect(response.status).toBe(404);
      expect(deleteBudget).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/budgets/:budgetId/archive", () => {
    it("archives the budget", async () => {
      jest.mocked(archiveBudget).mockResolvedValue(true);
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ status: "archived" }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/archive`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ status: "archived" }));
      expect(archiveBudget).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
    });

    it("returns 404 when the archive does not apply", async () => {
      jest.mocked(archiveBudget).mockResolvedValue(false);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/archive`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/budgets/:budgetId/unarchive", () => {
    it("unarchives the budget", async () => {
      jest.mocked(unarchiveBudget).mockResolvedValue(true);
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ status: "active" }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/unarchive`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ status: "active" }));
      expect(unarchiveBudget).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
    });

    it("returns 404 when the unarchive does not apply", async () => {
      jest.mocked(unarchiveBudget).mockResolvedValue(false);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/unarchive`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/budgets/:budgetId/clone", () => {
    const CLONED_ID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

    it("creates a copy of the budget and returns it with 201", async () => {
      const cloned = budgetRow({ id: CLONED_ID, name: "June (копия)" });
      jest.mocked(cloneBudget).mockResolvedValue(CLONED_ID);
      jest.mocked(findBudget).mockResolvedValue(cloned);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/clone`);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(cloned);
      expect(cloneBudget).toHaveBeenCalledWith(BUDGET_ID, TEST_USER_ID);
      expect(findBudget).toHaveBeenCalledWith(CLONED_ID, TEST_USER_ID);
    });

    it("returns 404 when the source budget is not found", async () => {
      jest.mocked(cloneBudget).mockResolvedValue(null);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/clone`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/budgets/:budgetId/activate", () => {
    it("activates an active budget", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue("active");
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ isActive: true }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/activate`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ isActive: true }));
      expect(setActiveBudget).toHaveBeenCalledWith(TEST_USER_ID, BUDGET_ID);
    });

    it("returns 409 for an archived budget", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue("archived");

      const response = await client.post(`/api/budgets/${BUDGET_ID}/activate`);

      expect(response.status).toBe(409);
      expect(setActiveBudget).not.toHaveBeenCalled();
    });

    it("returns 404 when the budget status is unknown", async () => {
      jest.mocked(getBudgetStatus).mockResolvedValue(null);

      const response = await client.post(`/api/budgets/${BUDGET_ID}/activate`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/budgets/:budgetId/deactivate", () => {
    it("clears the active budget", async () => {
      jest.mocked(findBudget).mockResolvedValue(budgetRow({ isActive: false }));

      const response = await client.post(`/api/budgets/${BUDGET_ID}/deactivate`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(budgetRow({ isActive: false }));
      expect(clearActiveBudget).toHaveBeenCalledWith(TEST_USER_ID, BUDGET_ID);
    });
  });
});
