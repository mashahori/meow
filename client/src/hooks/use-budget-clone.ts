import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cloneBudget } from '../lib/budget-api';

export function useBudgetCloneMutation(budgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cloneBudget(budgetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['budgets'] }),
  });
}
