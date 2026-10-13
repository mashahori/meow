import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Coins, WalletCards } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Budget } from '../lib/budget-api';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Field } from './ui/field';
import { Input } from './ui/input';
import { Spinner } from './ui/spinner';
import { createBudget, updateBudget } from '../lib/budget-api';

const budgetFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter a budget name').max(100, 'Maximum 100 characters'),
    startDate: z.string().date('Enter a valid start date'),
    endDate: z.string().date('Enter a valid end date'),
    initialAmount: z
      .number({ message: 'Enter an amount' })
      .finite('Enter a valid amount')
      .min(0, 'Amount cannot be negative')
      .max(9_999_999_999.99, 'Amount is too large'),
    currency: z.enum(['RUB', 'USD', 'EUR']),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'End date must not be before start date',
    path: ['endDate'],
  });

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

function getDefaultDates() {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const toDateInput = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  return { startDate: toDateInput(startDate), endDate: toDateInput(endDate) };
}

function getErrorMessage(error: unknown, action: 'create' | 'update') {
  return error instanceof Error
    ? error.message
    : `Unable to ${action} budget.`;
}

type BudgetFormDialogProps = {
  budget?: Budget;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderTrigger?: (open: () => void) => ReactNode | null;
};

export function BudgetFormDialog({
  budget,
  open,
  onOpenChange,
  renderTrigger,
}: BudgetFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = (nextOpen: boolean) => {
    setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };
  const queryClient = useQueryClient();
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: budget?.name ?? '',
      startDate: budget?.startDate ?? getDefaultDates().startDate,
      endDate: budget?.endDate ?? getDefaultDates().endDate,
      initialAmount: budget ? Number(budget.initialAmount) : 0,
      currency: budget?.currency ?? 'RUB',
    },
  });
  const mutation = useMutation({
    mutationFn: (values: BudgetFormValues) =>
      budget ? updateBudget(budget.id, values) : createBudget(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
      if (budget) {
        await queryClient.invalidateQueries({ queryKey: ['budget', budget.id] });
      }
      setOpen(false);
      form.reset();
    },
  });

  const onSubmit = form.handleSubmit((values) => mutation.mutate(values));
  const openDialog = () => {
    form.reset({
      name: budget?.name ?? '',
      startDate: budget?.startDate ?? getDefaultDates().startDate,
      endDate: budget?.endDate ?? getDefaultDates().endDate,
      initialAmount: budget ? Number(budget.initialAmount) : 0,
      currency: budget?.currency ?? 'RUB',
    });
    mutation.reset();
    setOpen(true);
  };
  const action = budget ? 'update' : 'create';

  return (
    <>
      {renderTrigger !== undefined ? (
        renderTrigger(openDialog)
      ) : (
        <Button onClick={openDialog}>
          <WalletCards />
          Create budget
        </Button>
      )}
      <Dialog
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            form.reset();
            mutation.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{budget ? 'Edit budget' : 'Create a budget'}</DialogTitle>
            <DialogDescription>
              {budget
                ? 'Update the name, period or starting amount for your budget.'
                : 'Set a name, period and starting amount for your budget.'}
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-5" onSubmit={onSubmit} noValidate>
            <Field
              label="Budget name"
              htmlFor="budget-name"
              error={form.formState.errors.name?.message}
            >
              <div className="relative">
                <WalletCards className="absolute left-4 top-3.5 size-[18px] text-[#aaa4b7]" />
                <Input
                  id="budget-name"
                  className="pl-11"
                  placeholder="e.g. Monthly budget"
                  autoFocus
                  {...form.register('name')}
                />
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                label="Start date"
                htmlFor="budget-start-date"
                error={form.formState.errors.startDate?.message}
              >
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-3.5 size-[18px] text-[#aaa4b7]" />
                  <Input
                    id="budget-start-date"
                    className="pl-11"
                    type="date"
                    {...form.register('startDate')}
                  />
                </div>
              </Field>
              <Field
                label="End date"
                htmlFor="budget-end-date"
                error={form.formState.errors.endDate?.message}
              >
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-3.5 size-[18px] text-[#aaa4b7]" />
                  <Input
                    id="budget-end-date"
                    className="pl-11"
                    type="date"
                    {...form.register('endDate')}
                  />
                </div>
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_0.8fr]">
              <Field
                label="Starting amount"
                htmlFor="budget-amount"
                error={form.formState.errors.initialAmount?.message}
              >
                <div className="relative">
                  <Coins className="absolute left-4 top-3.5 size-[18px] text-[#aaa4b7]" />
                  <Input
                    id="budget-amount"
                    className="pl-11"
                    type="number"
                    min="0"
                    max="9999999999.99"
                    step="0.01"
                    {...form.register('initialAmount', { valueAsNumber: true })}
                  />
                </div>
              </Field>
              <Field label="Currency" htmlFor="budget-currency">
                <select
                  id="budget-currency"
                  className="h-12 w-full rounded-xl border border-input bg-transparent px-4 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  {...form.register('currency')}
                >
                  <option value="RUB">RUB — Ruble</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </Field>
            </div>

            {mutation.isError ? (
              <p role="alert" className="text-sm font-medium text-destructive">
                {getErrorMessage(mutation.error, action)}
              </p>
            ) : null}

            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                  mutation.reset();
                }}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Spinner />
                    Creating…
                  </>
                ) : (
                  <>
                    {budget ? 'Save changes' : 'Create budget'}
                    <ArrowRight />
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreateBudgetDialog() {
  return <BudgetFormDialog />;
}
