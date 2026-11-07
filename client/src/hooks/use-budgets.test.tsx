// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useBudgetDetailsQuery,
  useBudgetsQuery,
  useDeleteBudgetMutation,
  useSaveBudgetMutation,
} from './use-budgets';
import {
  createBudget,
  deleteBudget,
  getBudgetDetails,
  getBudgets,
  updateBudget,
  type Budget,
  type CreateBudgetPayload,
} from '../lib/budget-api';

vi.mock('./use-auth', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'user-1' } })),
}));

vi.mock('../contexts/language-context', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

vi.mock('../lib/budget-api', () => ({
  createBudget: vi.fn(),
  deleteBudget: vi.fn(),
  getBudgetDetails: vi.fn(),
  getBudgets: vi.fn(),
  updateBudget: vi.fn(),
}));

const budgetId = '11111111-1111-4111-8111-111111111111';

const budget = {
  id: budgetId,
  name: 'November',
  status: 'active',
  isActive: true,
} as Budget;

const payload: CreateBudgetPayload = {
  name: 'November',
  startDate: '2026-11-01',
  endDate: '2026-11-30',
  initialAmount: 1000,
  currency: 'RUB',
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useBudgetsQuery', () => {
  it('loads budgets for the signed-in user', async () => {
    vi.mocked(getBudgets).mockResolvedValueOnce([budget]);

    const { result } = renderHook(() => useBudgetsQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([budget]);
  });

  it('does not load budgets without a signed-in user', async () => {
    const { useAuth } = await import('./use-auth');
    vi.mocked(useAuth).mockReturnValueOnce({ user: null } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => useBudgetsQuery(), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getBudgets).not.toHaveBeenCalled();
  });
});

describe('useBudgetDetailsQuery', () => {
  it('stays idle when no budget id is provided', () => {
    const { result } = renderHook(() => useBudgetDetailsQuery(undefined), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getBudgetDetails).not.toHaveBeenCalled();
  });
});

describe('useSaveBudgetMutation', () => {
  it('creates a budget when none is being edited', async () => {
    vi.mocked(createBudget).mockResolvedValueOnce(budget);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useSaveBudgetMutation(undefined, { onSuccess }), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(createBudget).toHaveBeenCalledWith(payload);
    expect(updateBudget).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('updates the budget and invalidates its details', async () => {
    vi.mocked(updateBudget).mockResolvedValueOnce(budget);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSaveBudgetMutation(budget), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(updateBudget).toHaveBeenCalledWith(budgetId, payload);
    expect(createBudget).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budgets'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budget', budgetId] });
  });
});

describe('useDeleteBudgetMutation', () => {
  it('deletes the budget and invalidates budget queries', async () => {
    vi.mocked(deleteBudget).mockResolvedValueOnce(undefined);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDeleteBudgetMutation({ onSuccess }), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(budgetId);
    });

    expect(deleteBudget).toHaveBeenCalledWith(budgetId);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budgets'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budget', budgetId] });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
