// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCategoryExpensesQuery,
  useDeleteExpenseMutation,
  useSaveExpenseMutation,
} from './use-expenses';
import {
  createExpense,
  deleteExpense,
  getCategoryExpenses,
  updateExpense,
  type Expense,
} from '../lib/expense-api';

vi.mock('../contexts/language-context', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

vi.mock('../lib/expense-api', () => ({
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getCategoryExpenses: vi.fn(),
  updateExpense: vi.fn(),
}));

const budgetId = '11111111-1111-4111-8111-111111111111';
const categoryId = '22222222-2222-4222-8222-222222222222';
const expenseId = '33333333-3333-4333-8333-333333333333';

const expense: Expense = {
  id: expenseId,
  budgetId,
  categoryId,
  amount: '150.00',
  spentAt: '2026-11-01',
  note: 'Lunch',
};

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCategoryExpensesQuery', () => {
  it('loads expenses for the category when enabled', async () => {
    vi.mocked(getCategoryExpenses).mockResolvedValueOnce([expense]);

    const { result } = renderHook(() => useCategoryExpensesQuery(categoryId, true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([expense]);
    expect(getCategoryExpenses).toHaveBeenCalledWith(categoryId, expect.anything());
  });

  it('does not request expenses while disabled', () => {
    renderHook(() => useCategoryExpensesQuery(categoryId, false), {
      wrapper: createWrapper(queryClient),
    });

    expect(getCategoryExpenses).not.toHaveBeenCalled();
  });
});

describe('useSaveExpenseMutation', () => {
  it('creates an expense and omits a blank note', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(expense);
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useSaveExpenseMutation(budgetId, categoryId, undefined, { onSuccess }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync({ amount: '150', spentAt: '2026-11-01', note: '   ' });
    });

    expect(createExpense).toHaveBeenCalledWith(budgetId, {
      categoryId,
      amount: '150',
      spentAt: '2026-11-01',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('creates an expense with a trimmed note', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(expense);

    const { result } = renderHook(() => useSaveExpenseMutation(budgetId, categoryId), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ amount: '150', spentAt: '2026-11-01', note: '  Lunch ' });
    });

    expect(createExpense).toHaveBeenCalledWith(budgetId, {
      categoryId,
      amount: '150',
      spentAt: '2026-11-01',
      note: 'Lunch',
    });
  });

  it('updates an existing expense and sends null for a blank note', async () => {
    vi.mocked(updateExpense).mockResolvedValueOnce({ ...expense, note: null });

    const { result } = renderHook(() => useSaveExpenseMutation(budgetId, categoryId, expense), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ amount: '200', spentAt: '2026-11-02', note: '' });
    });

    expect(updateExpense).toHaveBeenCalledWith(expenseId, {
      categoryId,
      amount: '200',
      spentAt: '2026-11-02',
      note: null,
    });
    expect(createExpense).not.toHaveBeenCalled();
  });

  it('moves an expense to another category and refreshes both categories', async () => {
    const targetCategoryId = '44444444-4444-4444-8444-444444444444';
    vi.mocked(updateExpense).mockResolvedValueOnce({ ...expense, categoryId: targetCategoryId });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSaveExpenseMutation(budgetId, categoryId, expense), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        categoryId: targetCategoryId,
        amount: '150',
        spentAt: '2026-11-01',
        note: 'Lunch',
      });
    });

    expect(updateExpense).toHaveBeenCalledWith(
      expenseId,
      expect.objectContaining({ categoryId: targetCategoryId }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['category-expenses', categoryId] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['category-expenses', targetCategoryId] });
  });

  it('invalidates the category expenses and budget after saving', async () => {
    vi.mocked(createExpense).mockResolvedValueOnce(expense);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSaveExpenseMutation(budgetId, categoryId), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({ amount: '150', spentAt: '2026-11-01', note: '' });
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['category-expenses', categoryId] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budget', budgetId] });
  });
});

describe('useDeleteExpenseMutation', () => {
  it('deletes the expense and refreshes related queries', async () => {
    vi.mocked(deleteExpense).mockResolvedValueOnce(undefined);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = vi.fn();

    const { result } = renderHook(
      () => useDeleteExpenseMutation(budgetId, categoryId, { onSuccess }),
      { wrapper: createWrapper(queryClient) },
    );

    await act(async () => {
      await result.current.mutateAsync(expenseId);
    });

    expect(deleteExpense).toHaveBeenCalledWith(expenseId);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['category-expenses', categoryId] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budget', budgetId] });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
