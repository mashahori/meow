import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExpenseFormDialog } from '../components/expense-form-dialog';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Spinner } from '../components/ui/spinner';
import { getBudgetDetails } from '../lib/budget-api';
import { deleteExpense, getCategoryExpenses, type Expense } from '../lib/expense-api';
import { useTranslation } from '../contexts/language-context';

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatMoney(amount: string | number, currency: string, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function CategoryDetailsPage() {
  const { t, locale } = useTranslation();
  const { budgetId, categoryId } = useParams();
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();
  const [deletingExpense, setDeletingExpense] = useState<Expense>();
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: ({ signal }) => {
      if (!budgetId) throw new Error(t('Budget not found.'));
      return getBudgetDetails(budgetId, signal);
    },
    enabled: Boolean(budgetId),
  });
  const category = budgetQuery.data?.categories.find((item) => item.id === categoryId);
  const expensesQuery = useQuery({
    queryKey: ['category-expenses', categoryId],
    queryFn: ({ signal }) => {
      if (!categoryId) throw new Error(t('Category not found.'));
      return getCategoryExpenses(categoryId, signal);
    },
    enabled: Boolean(category),
  });
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deletingExpense) throw new Error(t('Expense not found.'));
      return deleteExpense(deletingExpense.id);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['category-expenses', categoryId] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budgetId] }),
      ]);
      setDeletingExpense(undefined);
    },
  });

  if (budgetQuery.isPending && budgetId) {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-sm">
          <Spinner className="size-5 text-primary" aria-label={t('Loading budget')} />
          {t('Loading category…')}
        </div>
      </section>
    );
  }

  if (budgetQuery.isError || !budgetQuery.data || !budgetId) {
    return (
      <CategoryPageError
        budgetId={budgetId}
        message={
          budgetQuery.error instanceof Error
            ? t(budgetQuery.error.message)
            : !budgetId
            ? t('Budget not found.')
            : t('Unable to load budget.')
        }
      />
    );
  }

  const budget = budgetQuery.data;
  if (!category) {
    return (
      <CategoryPageError
        budgetId={budgetId}
        message={categoryId ? t('Category not found in this budget.') : t('Category not found.')}
      />
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to={`/budgets/${budget.id}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {budget.name}
      </Link>

      <header className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-primary">
            <CircleDollarSign size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t('Category details')}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{budget.name}</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('Planned')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(category.plannedAmount, budget.currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Spent')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(category.spentAmount, budget.currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Remaining')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(
                Number(category.plannedAmount) - Number(category.spentAmount),
                budget.currency,
                locale,
              )}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-9">
        <div className="flex items-start justify-between gap-4 flex-col">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t('Expenses')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setEditingExpense(undefined);
                setExpenseFormOpen(true);
              }}
            >
              <Plus />
              {t('Add expense')}
            </Button>
          </div>
        </div>

        {expensesQuery.isPending ? (
          <div className="mt-4 flex min-h-40 items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-medium text-muted-foreground shadow-sm">
            <Spinner className="size-5 text-primary" aria-label={t('Loading expenses')} />
            {t('Loading expenses…')}
          </div>
        ) : expensesQuery.isError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-border bg-white p-6 text-sm font-medium text-destructive shadow-sm"
          >
            {expensesQuery.error instanceof Error
              ? t(expensesQuery.error.message)
              : t('Unable to load expenses.')}
          </p>
        ) : expensesQuery.data.length > 0 ? (
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-white shadow-sm">
            {expensesQuery.data.map((expense) => (
              <article
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <ReceiptText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {expense.note || t('Expense')}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {formatDate(expense.spentAt, locale)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg font-semibold text-foreground">
                    {formatMoney(expense.amount, budget.currency, locale)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                      deleteMutation.reset();
                      setEditingExpense(expense);
                      setExpenseFormOpen(true);
                    }}
                    aria-label={`${t('Edit expense')} ${expense.note || formatDate(expense.spentAt, locale)}`}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    onClick={() => {
                      deleteMutation.reset();
                      setDeletingExpense(expense);
                    }}
                    aria-label={`${t('Delete expense')} ${expense.note || formatDate(expense.spentAt, locale)}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <ReceiptText className="mx-auto size-9 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
              {t('No expenses yet')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Expenses for this category will appear here once they are added.')}
            </p>
          </div>
        )}
      </section>
      <ExpenseFormDialog
        budgetId={budget.id}
        categoryId={category.id}
        startDate={budget.startDate}
        endDate={budget.endDate}
        currency={budget.currency}
        expense={editingExpense}
        open={expenseFormOpen}
        onOpenChange={(open) => {
          setExpenseFormOpen(open);
          if (!open) setEditingExpense(undefined);
        }}
      />
      <Dialog
        open={Boolean(deletingExpense)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingExpense(undefined);
            deleteMutation.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete expense?')}</DialogTitle>
            <DialogDescription>
              {t('This expense will be permanently removed from the category.')}
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {deleteMutation.error instanceof Error
                ? t(deleteMutation.error.message)
                : t('Unable to delete expense.')}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExpense(undefined)}
              disabled={deleteMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner />
                  {t('Deleting…')}
                </>
              ) : (
                <>
                  <Trash2 />
                  {t('Delete expense')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CategoryPageError({ budgetId, message }: { budgetId?: string; message: string }) {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to={budgetId ? `/budgets/${budgetId}` : '/budgets'}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t(budgetId ? 'Budget details' : 'All budgets')}
      </Link>
      <p
        role="alert"
        className="mt-6 rounded-xl border border-border bg-card p-6 text-sm font-medium text-destructive shadow-sm"
      >
        {message}
      </p>
    </section>
  );
}
