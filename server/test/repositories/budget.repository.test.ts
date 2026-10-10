import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { pool } from "../../src/db/pool";
import {
  isBudgetOwnedByUser,
  updateBudget,
} from "../../src/repositories/budget.repository";

jest.mock("../../src/db/pool", () => ({ pool: { query: jest.fn() } }));

const query = pool.query as unknown as jest.Mock<
  (sql: string, params: unknown[]) => Promise<{ rows: unknown[]; rowCount?: number }>
>;

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
