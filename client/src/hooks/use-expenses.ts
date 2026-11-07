import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../contexts/language-context';
import {
  createExpense,
  deleteExpense,
  getCategoryExpenses,
  updateExpense,
  type CreateExpensePayload,
  type Expense,
} from '../lib/expense-api';

type MutationOptions = {
  onSuccess?: () => void;
};

export type SaveExpenseValues = {
  amount: string;
  spentAt: string;
  note: string;
};

export function useCategoryExpensesQuery(categoryId: string | undefined, enabled: boolean) {
  const { t } = useTranslation();

  return useQuery({
    queryKey: ['category-expenses', categoryId],
    queryFn: ({ signal }) => {
      if (!categoryId) throw new Error(t('Category not found.'));
      return getCategoryExpenses(categoryId, signal);
    },
    enabled,
  });
}

export function useSaveExpenseMutation(
  budgetId: string,
  categoryId: string,
  expense?: Expense,
  options?: MutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: SaveExpenseValues) => {
      const note = values.note.trim();
      if (expense) {
        return updateExpense(expense.id, {
          amount: values.amount,
          spentAt: values.spentAt,
          note: note || null,
        });
      }
      const payload: CreateExpensePayload = {
        categoryId,
        amount: values.amount,
        spentAt: values.spentAt,
        ...(note ? { note } : {}),
      };
      return createExpense(budgetId, payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['category-expenses', categoryId] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]);
      options?.onSuccess?.();
    },
  });
}

export function useDeleteExpenseMutation(
  budgetId: string | undefined,
  categoryId: string | undefined,
  options?: MutationOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['category-expenses', categoryId] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]);
      options?.onSuccess?.();
    },
  });
}
