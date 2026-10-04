import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { pool } from "../../src/db/pool";
import { isBudgetOwnedByUser } from "../../src/repositories/budget.repository";

jest.mock("../../src/db/pool", () => ({ pool: { query: jest.fn() } }));

const query = pool.query as unknown as jest.Mock<
  (sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>
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
