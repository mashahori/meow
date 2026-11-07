import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activateBudget, deactivateBudget } from '../lib/budget-api';

export function useBudgetActiveMutation(budgetId: string, isActive: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => (isActive ? deactivateBudget(budgetId) : activateBudget(budgetId)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]),
  });
}
