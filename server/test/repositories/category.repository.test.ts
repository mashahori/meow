import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { pool } from "../../src/db/pool";
import {
  deleteOwnedCategory,
  findOwnedCategory,
  updateOwnedCategory,
} from "../../src/repositories/category.repository";

jest.mock("../../src/db/pool", () => ({
  pool: { query: jest.fn(), connect: jest.fn() },
}));

const query = pool.query as unknown as jest.Mock<
  (
    sql: string,
    params: unknown[],
  ) => Promise<{ rows: unknown[]; rowCount?: number }>
>;
const connect = pool.connect as unknown as jest.Mock<() => Promise<unknown>>;

describe("category repository", () => {
  const clientQuery = jest.fn<(sql: string, params?: unknown[]) => Promise<unknown>>();
  const release = jest.fn();

  beforeEach(() => {
    query.mockReset();
    clientQuery.mockReset();
    clientQuery.mockResolvedValue({ rows: [], rowCount: 1 });
    release.mockReset();
    connect.mockReset();
    connect.mockResolvedValue({ query: clientQuery, release });
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
    expect(params).toEqual(["category-id", "user-id", null, "1200.00", false, null]);
  });

  it("removes the group only when groupSlug is sent as null", async () => {
    query.mockResolvedValue({ rows: [], rowCount: 1 });

    await updateOwnedCategory("category-id", "user-id", { groupSlug: null });
    await updateOwnedCategory("category-id", "user-id", { groupSlug: "food" });

    const [sql, clearParams] = query.mock.calls[0];
    expect(sql).toMatch(/group_slug = CASE WHEN \$5::boolean THEN \$6::varchar ELSE c\.group_slug END/);
    expect(clearParams).toEqual(["category-id", "user-id", null, null, true, null]);
    expect(query.mock.calls[1][1]).toEqual(["category-id", "user-id", null, null, true, "food"]);
  });

  it("deletes the expenses and the category in one transaction", async () => {
    await expect(
      deleteOwnedCategory("category-id", "user-id"),
    ).resolves.toBe(true);

    const statements = clientQuery.mock.calls.map(([sql]) => sql);
    expect(statements[0]).toBe("BEGIN");
    expect(statements[1]).toMatch(/DELETE FROM expenses e/);
    expect(statements[2]).toMatch(/DELETE FROM categories c/);
    expect(statements[3]).toBe("COMMIT");
    expect(clientQuery.mock.calls[1][1]).toEqual(["category-id", "user-id"]);
    expect(clientQuery.mock.calls[2][1]).toEqual(["category-id", "user-id"]);
    expect(release).toHaveBeenCalled();
  });

  it("returns false without exposing categories owned by another user", async () => {
    clientQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(
      deleteOwnedCategory("category-id", "user-id"),
    ).resolves.toBe(false);
  });

  it("rolls back when the delete fails", async () => {
    clientQuery.mockImplementation(async (sql) => {
      if (sql.startsWith("DELETE FROM categories")) {
        throw new Error("boom");
      }
      return { rows: [], rowCount: 1 };
    });

    await expect(deleteOwnedCategory("category-id", "user-id")).rejects.toThrow("boom");
    expect(clientQuery.mock.calls.map(([sql]) => sql)).toContain("ROLLBACK");
    expect(release).toHaveBeenCalled();
  });
});
