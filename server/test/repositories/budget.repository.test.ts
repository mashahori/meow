import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { pool } from "../../src/db/pool";
import {
  archiveBudget,
  clearActiveBudget,
  deleteBudget,
  isBudgetOwnedByUser,
  listBudgets,
  setActiveBudget,
  unarchiveBudget,
  updateBudget,
} from "../../src/repositories/budget.repository";

jest.mock("../../src/db/pool", () => ({ pool: { query: jest.fn(), connect: jest.fn() } }));

const query = pool.query as unknown as jest.Mock<
  (sql: string, params: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>
>;
const connect = pool.connect as unknown as jest.Mock<() => Promise<unknown>>;

describe("deleteBudget", () => {
  const clientQuery = jest.fn<(sql: string, params?: unknown[]) => Promise<unknown>>();
  const release = jest.fn();

  beforeEach(() => {
    clientQuery.mockReset();
    clientQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    release.mockReset();
    connect.mockReset();
    connect.mockResolvedValue({ query: clientQuery, release });
  });

  it("hard-deletes expenses and the budget in a transaction", async () => {
    await deleteBudget("budget-1", "user-1");

    const statements = clientQuery.mock.calls.map(([sql]) => sql);
    expect(statements[0]).toBe("BEGIN");
    expect(statements[1]).toMatch(/^DELETE FROM expenses e/);
    expect(statements[1]).toMatch(/EXISTS \(SELECT 1 FROM budgets b WHERE b\.id = \$1 AND b\.user_id = \$2\)/);
    expect(clientQuery.mock.calls[1][1]).toEqual(["budget-1", "user-1"]);
    expect(statements[2]).toMatch(/^DELETE FROM budgets WHERE id = \$1 AND user_id = \$2$/);
    expect(statements[3]).toBe("COMMIT");
    expect(clientQuery.mock.calls[2][1]).toEqual(["budget-1", "user-1"]);
    expect(release).toHaveBeenCalled();
  });

  it("rolls back and rethrows when a statement fails", async () => {
    clientQuery.mockImplementation(async (sql) => {
      if (sql.startsWith("DELETE FROM budgets")) throw new Error("boom");
      return { rows: [], rowCount: 1 };
    });

    await expect(deleteBudget("budget-1", "user-1")).rejects.toThrow("boom");
    expect(clientQuery.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
    expect(release).toHaveBeenCalled();
  });
});

describe("isBudgetOwnedByUser", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("filters by both budget id and user id with bound parameters", async () => {
    query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    await isBudgetOwnedByUser("budget-1", "user-1");

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/id = \$1 AND user_id = \$2/);
    expect(params).toEqual(["budget-1", "user-1"]);
  });

  it("returns true when a row is found", async () => {
    query.mockResolvedValue({ rows: [{ "?column?": 1 }] });

    await expect(isBudgetOwnedByUser("b", "u")).resolves.toBe(true);
  });

  it("returns false when no row is found", async () => {
    query.mockResolvedValue({ rows: [] });

    await expect(isBudgetOwnedByUser("b", "u")).resolves.toBe(false);
  });
});

describe("updateBudget", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("updates initial amount and currency using bound parameters", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await updateBudget("budget-1", "user-1", {
      initialAmount: 10_000,
      currency: "USD",
    });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/initial_amount = COALESCE\(\$6, initial_amount\)/);
    expect(sql).toMatch(/currency = COALESCE\(\$7, currency\)/);
    expect(params).toEqual(["budget-1", "user-1", null, null, null, 10_000, "USD"]);
  });
});

describe("archiveBudget", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("archives the budget and removes it from the active budgets in one statement", async () => {
    query.mockResolvedValue({ rows: [{ archived: true }] });

    await expect(archiveBudget("budget-1", "user-1")).resolves.toBe(true);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/SET status = 'archived'/);
    expect(sql).toMatch(/DELETE FROM active_budgets/);
    expect(params).toEqual(["budget-1", "user-1"]);
  });

  it("returns false when the budget is not found for the user", async () => {
    query.mockResolvedValue({ rows: [{ archived: false }] });

    await expect(archiveBudget("budget-1", "user-1")).resolves.toBe(false);
  });
});

describe("unarchiveBudget", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("sets the budget status back to active for the owner", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await expect(unarchiveBudget("budget-1", "user-1")).resolves.toBe(true);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/SET status = 'active'/);
    expect(params).toEqual(["budget-1", "user-1"]);
  });

  it("returns false when the budget is not found for the user", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(unarchiveBudget("budget-1", "user-1")).resolves.toBe(false);
  });
});

describe("listBudgets", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("computes isActive from the active_budgets table", async () => {
    query.mockResolvedValue({ rows: [{ isActive: false }] });

    await expect(listBudgets("user-1")).resolves.toEqual([{ isActive: false }]);

    const [sql] = query.mock.calls[0];
    expect(sql).toMatch(/EXISTS \(\s*SELECT 1 FROM active_budgets ab/);
    expect(sql).toMatch(/AS "isActive"/);
  });
});

describe("active budgets", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("adds a budget to the active set without touching other active budgets", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await setActiveBudget("user-1", "budget-2");

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO active_budgets/);
    expect(sql).not.toMatch(/DELETE/);
    expect(params).toEqual(["user-1", "budget-2"]);
  });

  it("removes only the given budget from the active set", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await clearActiveBudget("user-1", "budget-2");

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/DELETE FROM active_budgets WHERE user_id = \$1 AND budget_id = \$2/);
    expect(params).toEqual(["user-1", "budget-2"]);
  });
});
