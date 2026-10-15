import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { pool } from "../../src/db/pool";
import {
  deleteOwnedCategory,
  findOwnedCategory,
  updateOwnedCategory,
} from "../../src/repositories/category.repository";

jest.mock("../../src/db/pool", () => ({ pool: { query: jest.fn() } }));

const query = pool.query as unknown as jest.Mock<
  (
    sql: string,
    params: unknown[],
  ) => Promise<{ rows: unknown[]; rowCount?: number }>
>;

describe("category repository", () => {
  beforeEach(() => {
    query.mockReset();
  });

  it("only finds a category through a budget owned by the user", async () => {
    query.mockResolvedValue({ rows: [] });

    await findOwnedCategory("category-id", "user-id");

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/JOIN budgets b ON b\.id = c\.budget_id/);
    expect(sql).toMatch(/c\.id = \$1 AND b\.user_id = \$2/);
    expect(params).toEqual(["category-id", "user-id"]);
  });

  it("updates only a category belonging to the user", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await expect(
      updateOwnedCategory("category-id", "user-id", {
        plannedAmount: "1200.00",
      }),
    ).resolves.toBe(true);

    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/c\.budget_id = b\.id AND b\.user_id = \$2/);
    expect(params).toEqual(["category-id", "user-id", null, "1200.00"]);
  });

  it("refuses to delete a category with expenses", async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ hasExpenses: true }] });

    await expect(
      deleteOwnedCategory("category-id", "user-id"),
    ).resolves.toBe("has_expenses");

    const [deleteSql, params] = query.mock.calls[0];
    expect(deleteSql).toMatch(/NOT EXISTS/);
    expect(params).toEqual(["category-id", "user-id"]);
  });

  it("returns not_found without exposing categories owned by another user", async () => {
    query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      deleteOwnedCategory("category-id", "user-id"),
    ).resolves.toBe("not_found");
  });
});
