import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CategoryFormDialog } from '../components/category-form-dialog';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Spinner } from '../components/ui/spinner';
import { deleteCategory, getBudgetDetails, type BudgetCategory } from '../lib/budget-api';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
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

export function BudgetDetailsPage() {
  const { budgetId } = useParams();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory>();
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategory>();
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: () => {
      if (!budgetId) throw new Error('Budget not found.');
      return getBudgetDetails(budgetId);
    },
    enabled: Boolean(budgetId),
  });
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!deletingCategory) throw new Error('Category not found.');
      return deleteCategory(deletingCategory.id);
    },
    onSuccess: async () => {
      if (budgetId) {
        await queryClient.invalidateQueries({ queryKey: ['budget', budgetId] });
      }
      setDeletingCategory(undefined);
    },
  });

  if (budgetQuery.isPending && budgetId) {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-sm">
          <Spinner className="size-5 text-primary" aria-label="Loading budget" />
          Loading budget…
        </div>
      </section>
    );
  }

  if (!budgetQuery.data) {
    return (
      <section className="mx-auto max-w-5xl">
        <Link
          to="/budgets"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All budgets
        </Link>
        <p
          role="alert"
          className="mt-6 rounded-xl border border-border bg-card p-6 text-sm font-medium text-destructive shadow-sm"
        >
          {!budgetId
            ? 'Budget not found.'
            : budgetQuery.error instanceof Error
              ? budgetQuery.error.message
              : 'Unable to load budget.'}
        </p>
      </section>
    );
  }

  const budget = budgetQuery.data;
  const spent = Number(budget.spentAmount);
  const planned = Number(budget.plannedAmount);
  const spendPercent = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to="/budgets"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All budgets
      </Link>

      <header className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#eee8fb] text-[#6d43e5]">
              <WalletCards size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">
                Budget details
              </p>
              <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-[#241c3b]">
                {budget.name}
              </h1>
              <span
                className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                  budget.isActive
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {budget.isActive
                  ? 'Active'
                  : budget.status === 'archived'
                    ? 'Archived'
                    : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-[#f8f6fc] px-4 py-3 text-sm">
            <CalendarDays className="size-5 text-[#6d43e5]" />
            <div>
              <p className="text-muted-foreground">Budget period</p>
              <p className="mt-1 font-medium text-foreground">
                {formatDate(budget.startDate)} — {formatDate(budget.endDate)}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-7 border-t border-border pt-5">
          <p className="text-sm text-muted-foreground">Starting amount</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
            {formatMoney(budget.initialAmount, budget.currency)}
          </p>
        </div>
      </header>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Planned</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">
            {formatMoney(budget.plannedAmount, budget.currency)}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Spent</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">
            {formatMoney(budget.spentAmount, budget.currency)}
          </p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeaf4]"
            role="progressbar"
            aria-label="Budget spent"
            aria-valuemin={0}
            aria-valuemax={planned || 1}
            aria-valuenow={Math.min(Math.max(spent, 0), planned || 1)}
          >
            <div
              className="h-full rounded-full bg-[#7650e8]"
              style={{ width: `${spendPercent}%` }}
            />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="mt-2 font-display text-2xl font-semibold text-foreground">
            {formatMoney(budget.remainingAmount, budget.currency)}
          </p>
        </article>
      </div>

      <section className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Budget categories
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Spending and planned amounts for this period.
            </p>
          </div>
          <span className="rounded-full bg-[#f1eef8] px-3 py-1 text-sm font-semibold text-[#6d43e5]">
            {budget.categories.length}
          </span>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(undefined);
            setCategoryFormOpen(true);
          }}
        >
          <Plus />
          Create category
        </Button>

        {budget.categories.length > 0 ? (
          <div className="mt-4 space-y-3">
            {budget.categories.map((category) => {
              const categoryPlanned = Number(category.plannedAmount);
              const categorySpent = Number(category.spentAmount);
              const categoryPercent =
                categoryPlanned > 0 ? Math.min((categorySpent / categoryPlanned) * 100, 100) : 0;

              return (
                <article
                  key={category.id}
                  className="rounded-xl border border-border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#f4f1fa] text-[#7650e8]">
                        <CircleDollarSign className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatMoney(categorySpent, budget.currency)} spent
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Planned{' '}
                      <span className="font-semibold text-foreground">
                        {formatMoney(category.plannedAmount, budget.currency)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryFormOpen(true);
                      }}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deleteMutation.reset();
                        setDeletingCategory(category);
                      }}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-[#eeeaf4]"
                    role="progressbar"
                    aria-label={`${category.name} spending`}
                    aria-valuemin={0}
                    aria-valuemax={categoryPlanned || 1}
                    aria-valuenow={Math.min(Math.max(categorySpent, 0), categoryPlanned || 1)}
                  >
                    <div
                      className="h-full rounded-full bg-[#7650e8]"
                      style={{ width: `${categoryPercent}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-white px-6 py-12 text-center">
            <CircleDollarSign className="mx-auto size-9 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold text-foreground">
              No categories yet
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Categories for this budget will appear here once they are added.
            </p>
          </div>
        )}
      </section>
      <CategoryFormDialog
        budgetId={budget.id}
        currency={budget.currency}
        category={editingCategory}
        open={categoryFormOpen}
        onOpenChange={(open) => {
          setCategoryFormOpen(open);
          if (!open) setEditingCategory(undefined);
        }}
      />
      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(undefined);
            deleteMutation.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              “{deletingCategory?.name}” will be removed from this budget. Categories with expenses
              cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'Unable to delete category.'}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCategory(undefined)}
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
                  Delete category
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
