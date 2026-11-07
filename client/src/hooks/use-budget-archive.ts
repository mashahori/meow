import { useMutation, useQueryClient } from '@tanstack/react-query';
import { archiveBudget, unarchiveBudget } from '../lib/budget-api';

export function useBudgetArchiveMutation(budgetId: string, isArchived: boolean) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => (isArchived ? unarchiveBudget(budgetId) : archiveBudget(budgetId)),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]),
  });
}
