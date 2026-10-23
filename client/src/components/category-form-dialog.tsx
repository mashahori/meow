import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Coins, Tag } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { BudgetCategory, CategoryPayload } from '../lib/budget-api';
import { createCategory, updateCategory } from '../lib/budget-api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Field } from './ui/field';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';
import { useTranslation } from '../contexts/language-context';

function createCategoryFormSchema(t: (text: string) => string) {
  return z.object({
    name: z.string().trim().min(1, t('Enter a category name')).max(100, t('Maximum 100 characters')),
    plannedAmount: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,9})$/, t('Enter a whole amount')),
  });
}

type CategoryFormValues = z.infer<ReturnType<typeof createCategoryFormSchema>>;

type CategoryFormDialogProps = {
  budgetId: string;
  currency: string;
  category?: BudgetCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CategoryFormDialog({
  budgetId,
  currency,
  category,
  open,
  onOpenChange,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const categoryFormSchema = createCategoryFormSchema(t);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? '',
      plannedAmount: category?.plannedAmount ?? '',
    },
  });
  const mutation = useMutation({
    mutationFn: (payload: CategoryPayload) =>
      category ? updateCategory(category.id, payload) : createCategory(budgetId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      onOpenChange(false);
    },
  });
  const { reset: resetForm } = form;
  const { reset: resetMutation } = mutation;

  useEffect(() => {
    if (!open) return;

    resetForm({
      name: category?.name ?? '',
      plannedAmount: category?.plannedAmount ?? '',
    });
    resetMutation();
  }, [category, open, resetForm, resetMutation]);

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
          resetMutation();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(category ? 'Edit category' : 'Create a category')}</DialogTitle>
          <DialogDescription>
            {category
              ? t('Update the category name or planned amount.')
              : t('Add a category and its planned spending amount to this budget.')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field
            label={t('Category name')}
            htmlFor="category-name"
            error={form.formState.errors.name?.message}
          >
            <div className="relative">
              <Tag className="absolute left-4 top-3.5 size-[18px] text-[#a3a3a3]" />
              <Input
                id="category-name"
                className="pl-11"
                placeholder={t('e.g. Groceries')}
                autoFocus
                {...form.register('name')}
              />
            </div>
          </Field>
          <Field
            label={`${t('Planned amount')} (${currency})`}
            htmlFor="category-planned-amount"
            error={form.formState.errors.plannedAmount?.message}
          >
            <div className="relative">
              <Coins className="absolute left-4 top-3.5 size-[18px] text-[#a3a3a3]" />
              <Input
                id="category-planned-amount"
                className="pl-11"
                inputMode="numeric"
                placeholder="0"
                {...form.register('plannedAmount')}
              />
            </div>
          </Field>
          {mutation.isError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {mutation.error instanceof Error
                ? t(mutation.error.message)
                : t(category ? 'Unable to update category.' : 'Unable to create category.')}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Spinner />
                  {t('Saving…')}
                </>
              ) : category ? (
                t('Save changes')
              ) : (
                t('Create category')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
