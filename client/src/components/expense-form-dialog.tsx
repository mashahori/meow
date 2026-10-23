import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Expense } from '../lib/expense-api';
import { createExpense, updateExpense, type CreateExpensePayload } from '../lib/expense-api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Field } from './ui/field';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';
import { useTranslation } from '../contexts/language-context';

const amountPattern = /^(?:0|[1-9]\d{0,9})$/;

function createExpenseFormSchema(t: (text: string) => string) {
  return z.object({
    amount: z
      .string()
      .regex(amountPattern, t('Enter a whole amount'))
      .refine((value) => Number(value) > 0, t('Amount must be greater than zero')),
    spentAt: z.string().date(),
    note: z.string().trim().max(500, t('Maximum 500 characters')),
  });
}

type ExpenseFormValues = z.infer<ReturnType<typeof createExpenseFormSchema>>;

type ExpenseFormDialogProps = {
  budgetId: string;
  categoryId: string;
  startDate: string;
  endDate: string;
  currency: string;
  expense?: Expense;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getDefaultDate(startDate: string, endDate: string) {
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return localToday < startDate || localToday > endDate ? startDate : localToday;
}

export function ExpenseFormDialog({
  budgetId,
  categoryId,
  startDate,
  endDate,
  currency,
  expense,
  open,
  onOpenChange,
}: ExpenseFormDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const expenseFormSchema = createExpenseFormSchema(t);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: expense?.amount ?? '',
      spentAt: expense?.spentAt ?? getDefaultDate(startDate, endDate),
      note: expense?.note ?? '',
    },
  });
  const mutation = useMutation({
    mutationFn: async (values: ExpenseFormValues) => {
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
      onOpenChange(false);
    },
  });

  // useEffect(() => {
  //   if (open) {
  //     form.reset({
  //       amount: expense?.amount ?? '',
  //       spentAt: expense?.spentAt ?? getDefaultDate(startDate, endDate),
  //       note: expense?.note ?? '',
  //     });
  //     mutation.reset();
  //   }
  // }, [endDate, expense, form, mutation, open, startDate]);

  const onSubmit = form.handleSubmit((values) => {
    if (values.spentAt < startDate || values.spentAt > endDate) {
      form.setError('spentAt', { message: t('Date must be within the budget period') });
      return;
    }
    mutation.mutate(values);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          form.reset();
          mutation.reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(expense ? 'Edit expense' : 'Add an expense')}</DialogTitle>
          <DialogDescription>
            {expense
              ? t('Update the expense amount, date, or note.')
              : t('Record a new expense in this category.')}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field
            label={`${t('Amount')} (${currency})`}
            htmlFor="expense-amount"
            error={form.formState.errors.amount?.message}
          >
            <Input
              id="expense-amount"
              inputMode="numeric"
              placeholder="0"
              autoFocus
              {...form.register('amount')}
            />
          </Field>
          <Field label={t('Date')} htmlFor="expense-date" error={form.formState.errors.spentAt?.message}>
            <Input
              id="expense-date"
              type="date"
              min={startDate}
              max={endDate}
              {...form.register('spentAt')}
            />
          </Field>
          <Field label={t('Note')} htmlFor="expense-note" error={form.formState.errors.note?.message}>
            <Input
              id="expense-note"
              placeholder={t('What was this expense for?')}
              maxLength={500}
              {...form.register('note')}
            />
          </Field>
          {mutation.isError ? (
            <p role="alert" className="text-sm font-medium text-destructive">
              {mutation.error instanceof Error
                ? t(mutation.error.message)
                : t(expense ? 'Unable to update expense.' : 'Unable to create expense.')}
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
              ) : expense ? (
                t('Save changes')
              ) : (
                t('Add expense')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
