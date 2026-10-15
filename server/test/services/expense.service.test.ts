import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundError, ValidationError } from '../../src/errors/app-error';
import {
  findBudgetPeriod,
  findCategoryBudget,
  findOwnedExpense,
  insertExpense,
} from '../../src/repositories/expense.repository';
import { createExpense, editExpense } from '../../src/services/expense.service';

jest.mock('../../src/repositories/expense.repository');

const mockedFindBudgetPeriod = jest.mocked(findBudgetPeriod);
const mockedFindCategoryBudget = jest.mocked(findCategoryBudget);
const mockedFindOwnedExpense = jest.mocked(findOwnedExpense);
const mockedInsertExpense = jest.mocked(insertExpense);

const payload = {
  categoryId: '3f2504e0-e89b-41d4-a716-446655440000',
  amount: '10.00',
  spentAt: '2026-06-15',
};

describe('expense service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects an expense whose category belongs to another budget', async () => {
    mockedFindCategoryBudget.mockResolvedValue('other-budget');

    await expect(createExpense('budget-id', 'user-id', payload)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(mockedInsertExpense).not.toHaveBeenCalled();
  });

  it('rejects an expense outside the budget period', async () => {
    mockedFindCategoryBudget.mockResolvedValue('budget-id');
    mockedFindBudgetPeriod.mockResolvedValue({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    });

    await expect(
      createExpense('budget-id', 'user-id', {
        ...payload,
        spentAt: '2026-07-01',
      }),
    ).rejects.toBeInstanceOf(ValidationError);
    expect(mockedInsertExpense).not.toHaveBeenCalled();
  });

  it('does not update an expense owned by another user', async () => {
    mockedFindOwnedExpense.mockResolvedValue(null);

    await expect(editExpense('expense-id', 'user-id', { amount: '20.00' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
