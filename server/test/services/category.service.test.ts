import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../../src/errors/app-error";
import {
  deleteOwnedCategory,
  insertCategory,
  updateOwnedCategory,
} from "../../src/repositories/category.repository";
import {
  createCategory,
  editCategory,
  removeCategory,
} from "../../src/services/category.service";

jest.mock("../../src/repositories/category.repository");

const mockedInsertCategory = jest.mocked(insertCategory);
const mockedUpdateOwnedCategory = jest.mocked(updateOwnedCategory);
const mockedDeleteOwnedCategory = jest.mocked(deleteOwnedCategory);

const unknownGroupError = {
  code: "23503",
  constraint: "categories_group_slug_fkey",
};

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

  it("returns a validation error for an unknown group on create and update", async () => {
    mockedInsertCategory.mockRejectedValue(unknownGroupError);
    mockedUpdateOwnedCategory.mockRejectedValue(unknownGroupError);

    await expect(
      createCategory("budget-id", {
        name: "Groceries",
        plannedAmount: "10",
        groupSlug: "unknown",
      }),
    ).rejects.toMatchObject({
      details: [{ field: "groupSlug", message: "Unknown category group" }],
    });
    await expect(
      editCategory("category-id", "user-id", { groupSlug: "unknown" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns not found when deleting a category not owned by the user", async () => {
    mockedDeleteOwnedCategory.mockResolvedValue(false);

    await expect(
      removeCategory("category-id", "user-id"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
