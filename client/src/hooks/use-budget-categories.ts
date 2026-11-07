import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type BudgetCategory,
  type CategoryPayload,
} from '../lib/budget-api';

type MutationOptions = {
  onSuccess?: () => void;
};

export function useSaveCategoryMutation(
  budgetId: string,
  category?: BudgetCategory,
  options?: MutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CategoryPayload) =>
      category ? updateCategory(category.id, payload) : createCategory(budgetId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteCategoryMutation(budgetId: string | undefined, options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => deleteCategory(categoryId),
    onSuccess: async () => {
      if (budgetId) {
        await queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      }
      options?.onSuccess?.();
    },
  });
}
