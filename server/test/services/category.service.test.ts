import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ConflictError, NotFoundError } from "../../src/errors/app-error";
import {
  deleteOwnedCategory,
  insertCategory,
} from "../../src/repositories/category.repository";
import {
  createCategory,
  removeCategory,
} from "../../src/services/category.service";

jest.mock("../../src/repositories/category.repository");

const mockedInsertCategory = jest.mocked(insertCategory);
const mockedDeleteOwnedCategory = jest.mocked(deleteOwnedCategory);

describe("category service", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns a conflict when a category name is already used in the budget", async () => {
    mockedInsertCategory.mockRejectedValue({
      code: "23505",
      constraint: "categories_budget_id_name_key",
    });

    await expect(
      createCategory("budget-id", {
        name: "Groceries",
        plannedAmount: "10.00",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("returns a conflict when deleting a category with expenses", async () => {
    mockedDeleteOwnedCategory.mockResolvedValue("has_expenses");

    await expect(
      removeCategory("category-id", "user-id"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("returns not found when deleting a category not owned by the user", async () => {
    mockedDeleteOwnedCategory.mockResolvedValue("not_found");

    await expect(
      removeCategory("category-id", "user-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
