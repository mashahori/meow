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

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function CategoryDetailsPage() {
  const { budgetId, categoryId } = useParams();
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();
  const [deletingExpense, setDeletingExpense] = useState<Expense>();
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => {
      if (!budgetId) throw new Error('Budget not found.');
      return getBudgetDetails(budgetId);
    },
    enabled: Boolean(budgetId),
  });
  const category = budgetQuery.data?.categories.find((item) => item.id === categoryId);
  const expensesQuery = useQuery({
    queryKey: ['category-expenses', categoryId],
    queryFn: () => {
      if (!categoryId) throw new Error('Category not found.');
      return getCategoryExpenses(categoryId);
    },
    enabled: Boolean(category),
  });
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deletingExpense) throw new Error('Expense not found.');
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
          <Spinner className="size-5 text-primary" aria-label="Loading budget" />
          Loading category…
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
            ? budgetQuery.error.message
            : !budgetId
              ? 'Budget not found.'
              : 'Unable to load budget.'
        }
      />
    );
  }

  const budget = budgetQuery.data;
  if (!category) {
    return (
      <CategoryPageError
        budgetId={budgetId}
        message={categoryId ? 'Category not found in this budget.' : 'Category not found.'}
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
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eee8fb] text-[#6d43e5]">
            <CircleDollarSign size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">
              Category details
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-[#241c3b]">
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{budget.name}</p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-1 gap-5 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Planned</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(category.plannedAmount, budget.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Spent</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(category.spentAmount, budget.currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatMoney(
                Number(category.plannedAmount) - Number(category.spentAmount),
                budget.currency,
              )}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Expenses
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">All expenses in this category.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#f1eef8] px-3 py-1 text-sm font-semibold text-[#6d43e5]">
              {expensesQuery.data?.length ?? 0}
            </span>
            <Button
              onClick={() => {
                setEditingExpense(undefined);
                setExpenseFormOpen(true);
              }}
            >
              <Plus />
              Add expense
            </Button>
          </div>
        </div>

        {expensesQuery.isPending ? (
          <div className="mt-4 flex min-h-40 items-center justify-center gap-3 rounded-xl border border-border bg-white text-sm font-medium text-muted-foreground shadow-sm">
            <Spinner className="size-5 text-primary" aria-label="Loading expenses" />
            Loading expenses…
          </div>
        ) : expensesQuery.isError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-border bg-white p-6 text-sm font-medium text-destructive shadow-sm"
          >
            {expensesQuery.error instanceof Error
              ? expensesQuery.error.message
              : 'Unable to load expenses.'}
          </p>
        ) : expensesQuery.data.length > 0 ? (
          <div className="mt-4 divide-y divide-border rounded-xl border border-border bg-white shadow-sm">
            {expensesQuery.data.map((expense) => (
              <article
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4f1fa] text-[#7650e8]">
                    <ReceiptText className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {expense.note || 'Expense'}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {formatDate(expense.spentAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-display text-lg font-semibold text-foreground">
                    {formatMoney(expense.amount, budget.currency)}
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
                    aria-label={`Edit expense ${expense.note || formatDate(expense.spentAt)}`}
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
                    aria-label={`Delete expense ${expense.note || formatDate(expense.spentAt)}`}
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
              No expenses yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Expenses for this category will appear here once they are added.
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
            <DialogTitle>Delete expense?</DialogTitle>
            <DialogDescription>
              This expense will be permanently removed from the category.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Unable to delete expense.'}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingExpense(undefined)}
              disabled={deleteMutation.isPending}
            >
              Cancel
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
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 />
                  Delete expense
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
  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to={budgetId ? `/budgets/${budgetId}` : '/budgets'}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {budgetId ? 'Budget details' : 'All budgets'}
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
