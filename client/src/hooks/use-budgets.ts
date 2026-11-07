import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../contexts/language-context';
import {
  createBudget,
  deleteBudget,
  getBudgetDetails,
  getBudgets,
  updateBudget,
  type Budget,
  type CreateBudgetPayload,
} from '../lib/budget-api';
import { useAuth } from './use-auth';

type MutationOptions = {
  onSuccess?: () => void;
};

export function useBudgetsQuery() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: ({ signal }) => getBudgets(signal),
    enabled: user !== null,
  });
}

export function useBudgetDetailsQuery(budgetId: string | undefined) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['budget', budgetId],
    queryFn: ({ signal }) => {
      if (!budgetId) throw new Error(t('Budget not found.'));
      return getBudgetDetails(budgetId, signal);
    },
    enabled: Boolean(budgetId),
  });
}

export function useSaveBudgetMutation(budget?: Budget, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) =>
      budget ? updateBudget(budget.id, payload) : createBudget(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (budget) {
        await queryClient.invalidateQueries({ queryKey: ['budget', budget.id] });
      }
      options?.onSuccess?.();
    },
  });
}

export function useDeleteBudgetMutation(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (budgetId: string) => deleteBudget(budgetId),
    onSuccess: async (_data, budgetId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]);
      options?.onSuccess?.();
    },
  });
}
