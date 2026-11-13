import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  deleteCategory,
  getCategoryGroups,
  updateCategory,
  type BudgetCategory,
  type CategoryPayload,
} from '../lib/budget-api';

type MutationOptions = {
  onSuccess?: () => void;
};

// The list is a system dictionary that only changes with a release, so it is never refetched.
export function useCategoryGroupsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['category-groups'],
    queryFn: ({ signal }) => getCategoryGroups(signal),
    staleTime: Infinity,
    enabled,
  });
}

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
