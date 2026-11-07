import {
  ArrowLeft,
  Archive,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
  Copy,
  Ellipsis,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Menu } from '@base-ui/react/menu';
import { CategoryFormDialog } from '../components/category-form-dialog';
import { BudgetFormDialog } from '../components/create-budget-dialog';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Spinner } from '../components/ui/spinner';
import type { BudgetCategory } from '../lib/budget-api';
import { formatNumberWithSpaceGrouping } from '../lib/number-format';
import { useBudgetArchiveMutation } from '../hooks/use-budget-archive';
import { useBudgetActiveMutation } from '../hooks/use-budget-active';
import { useBudgetCloneMutation } from '../hooks/use-budget-clone';
import { useBudgetDetailsQuery, useDeleteBudgetMutation } from '../hooks/use-budgets';
import { useDeleteCategoryMutation } from '../hooks/use-budget-categories';
import { useTranslation } from '../contexts/language-context';

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatAmount(amount: string | number, currency: string, locale: string) {
  return formatNumberWithSpaceGrouping(amount, locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

export function BudgetDetailsPage() {
  const { t, locale } = useTranslation();
  const { budgetId } = useParams();
  const navigate = useNavigate();
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory>();
  const [deletingCategory, setDeletingCategory] = useState<BudgetCategory>();
  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [deleteBudgetDialogOpen, setDeleteBudgetDialogOpen] = useState(false);
  const budgetQuery = useBudgetDetailsQuery(budgetId);
  const deleteMutation = useDeleteCategoryMutation(budgetId, {
    onSuccess: () => setDeletingCategory(undefined),
  });
  const deleteBudgetMutation = useDeleteBudgetMutation({
    onSuccess: () => setDeleteBudgetDialogOpen(false),
  });
  const archiveMutation = useBudgetArchiveMutation(
    budgetId ?? '',
    budgetQuery.data?.status === 'archived',
  );
  const activeMutation = useBudgetActiveMutation(budgetId ?? '', budgetQuery.data?.isActive ?? false);
  const cloneMutation = useBudgetCloneMutation(budgetId ?? '');

  if (budgetQuery.isPending && budgetId) {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-sm">
          <Spinner className="size-5 text-primary" aria-label={t('Loading budget')} />
          {t('Loading budget…')}
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
          {t('All budgets')}
        </Link>
        <p
          role="alert"
          className="mt-6 rounded-xl border border-border bg-card p-6 text-sm font-medium text-destructive shadow-sm"
        >
          {!budgetId
            ? t('Budget not found.')
            : budgetQuery.error instanceof Error
              ? t(budgetQuery.error.message)
              : t('Unable to load budget.')}
        </p>
      </section>
    );
  }

  const budget = budgetQuery.data;
  const spent = Number(budget.spentAmount);
  const planned = Number(budget.plannedAmount);
  const spendPercent = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0;
  const isOverSpent = spent > planned;

  return (
    <section className="mx-auto max-w-5xl">
      <Link
        to="/budgets"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('All budgets')}
      </Link>

      <header className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-1 items-start gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-4">
              <div className="order-1">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t('Budget details')}
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {budget.name}
                </h1>
                <span
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    budget.isActive ? 'bg-muted text-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {budget.isActive
                    ? t('Active')
                    : budget.status === 'archived'
                      ? t('Archived')
                      : t('Inactive')}
                </span>
              </div>
              <div className="order-3 w-full text-left sm:order-2 sm:ml-auto sm:w-auto sm:text-right">
                <p className="text-sm text-muted-foreground">{t('Starting amount')}</p>
                <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                  {formatAmount(budget.initialAmount, budget.currency, locale)}
                </p>
              </div>
              <div className="order-2 shrink-0 sm:order-3">
                <Menu.Root>
                  <Menu.Trigger
                    aria-label={`${t('Actions for')} ${budget.name}`}
                    render={<Button variant="ghost" size="icon-sm" />}
                  >
                    <Ellipsis aria-hidden="true" />
                  </Menu.Trigger>
                  <Menu.Portal>
                    <Menu.Positioner sideOffset={6} align="end" className="z-50">
                      <Menu.Popup className="min-w-40 rounded-lg border border-border bg-white p-1 shadow-lg outline-none">
                        <Menu.Item
                          onClick={() => setBudgetFormOpen(true)}
                          className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          {t('Edit')}
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => {
                            cloneMutation.reset();
                            cloneMutation.mutate(undefined, {
                              onSuccess: (clonedBudget) => navigate(`/budgets/${clonedBudget.id}`),
                            });
                          }}
                          className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                        >
                          <Copy className="size-4" aria-hidden="true" />
                          {t('Clone')}
                        </Menu.Item>
                        {budget.status === 'active' ? (
                          <Menu.Item
                            onClick={() => {
                              activeMutation.reset();
                              activeMutation.mutate();
                            }}
                            className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                          >
                            <CircleCheck className="size-4" aria-hidden="true" />
                            {budget.isActive ? t('Make inactive') : t('Make active')}
                          </Menu.Item>
                        ) : null}
                        <Menu.Item
                          onClick={() => {
                            archiveMutation.reset();
                            archiveMutation.mutate();
                          }}
                          className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                        >
                          <Archive className="size-4" aria-hidden="true" />
                          {budget.status === 'archived' ? t('Restore from archive') : t('Archive')}
                        </Menu.Item>
                        <Menu.Item
                          onClick={() => {
                            deleteBudgetMutation.reset();
                            setDeleteBudgetDialogOpen(true);
                          }}
                          className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          {t('Delete')}
                        </Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.Root>
              </div>
            </div>
          </div>
          <div className="flex w-full items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-muted px-4 py-3 text-sm">
              <CalendarDays className="size-5 text-primary" />
              <div>
                <p className="text-muted-foreground">{t('Budget period')}</p>
                <p className="mt-1 font-medium text-foreground">
                  {formatDate(budget.startDate, locale)} — {formatDate(budget.endDate, locale)}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">{t('Planned')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatAmount(budget.plannedAmount, budget.currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Spent')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatAmount(budget.spentAmount, budget.currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('Remaining')}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {formatAmount(budget.remainingAmount, budget.currency, locale)}
            </p>
          </div>
        </div>
        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t('Budget spent')}
          aria-valuemin={0}
          aria-valuemax={planned || 1}
          aria-valuenow={Math.min(Math.max(spent, 0), planned || 1)}
        >
          <div
            className={`h-full rounded-full ${isOverSpent ? 'bg-progress-over' : 'bg-progress-ok'}`}
            style={{ width: `${spendPercent}%` }}
          />
        </div>
      </header>

      {activeMutation.isError ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {activeMutation.error instanceof Error
            ? t(activeMutation.error.message)
            : t('Unable to update active budget.')}
        </p>
      ) : null}

      {archiveMutation.isError ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {archiveMutation.error instanceof Error
            ? t(archiveMutation.error.message)
            : t('Unable to update budget archive.')}
        </p>
      ) : null}

      {cloneMutation.isError ? (
        <p role="alert" className="mt-4 text-sm font-medium text-destructive">
          {cloneMutation.error instanceof Error
            ? t(cloneMutation.error.message)
            : t('Unable to clone budget.')}
        </p>
      ) : null}

      <section className="mt-9">
        <div className="flex items-end justify-between gap-4">
          <div className="mb-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              {t('Budget categories')}
            </h2>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(undefined);
            setCategoryFormOpen(true);
          }}
        >
          <Plus />
          {t('Create category')}
        </Button>

        {budget.categories.length > 0 ? (
          <div className="mt-4 space-y-3">
            {budget.categories.map((category) => {
              const categoryPlanned = Number(category.plannedAmount);
              const categorySpent = Number(category.spentAmount);
              const categoryPercent =
                categoryPlanned > 0 ? Math.min((categorySpent / categoryPlanned) * 100, 100) : 0;
              const isCategoryOverSpent = categorySpent > categoryPlanned;

              return (
                <article
                  key={category.id}
                  className="group rounded-xl border border-border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <Link
                      to={`/budgets/${budget.id}/${category.id}`}
                      className="flex flex-1 flex-wrap items-center justify-between gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${t('Open expenses')} ${category.name}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                          <CircleDollarSign className="size-5" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary">
                            {category.name}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatAmount(categorySpent, budget.currency, locale)} {t('spent')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t('Planned')}{' '}
                        <span className="font-semibold text-foreground">
                          {formatAmount(category.plannedAmount, budget.currency, locale)}
                        </span>
                      </p>
                    </Link>
                    <Menu.Root>
                      <Menu.Trigger
                        aria-label={`${t('Actions for')} ${category.name}`}
                        render={<Button variant="ghost" size="icon-sm" />}
                      >
                        <Ellipsis aria-hidden="true" />
                      </Menu.Trigger>
                      <Menu.Portal>
                        <Menu.Positioner sideOffset={6} align="end" className="z-50">
                          <Menu.Popup className="min-w-40 rounded-lg border border-border bg-white p-1 shadow-lg outline-none">
                            <Menu.Item
                              onClick={() => {
                                setEditingCategory(category);
                                setCategoryFormOpen(true);
                              }}
                              className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                              {t('Edit')}
                            </Menu.Item>
                            <Menu.Item
                              onClick={() => {
                                deleteMutation.reset();
                                setDeletingCategory(category);
                              }}
                              className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none data-highlighted:bg-destructive/10"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              {t('Delete')}
                            </Menu.Item>
                          </Menu.Popup>
                        </Menu.Positioner>
                      </Menu.Portal>
                    </Menu.Root>
                  </div>
                  <div
                    className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${category.name}: ${t('Spent')}`}
                    aria-valuemin={0}
                    aria-valuemax={categoryPlanned || 1}
                    aria-valuenow={Math.min(Math.max(categorySpent, 0), categoryPlanned || 1)}
                  >
                    <div
                      className={`h-full rounded-full ${isCategoryOverSpent ? 'bg-progress-over' : 'bg-progress-ok'}`}
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
              {t('No categories yet')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Categories for this budget will appear here once they are added.')}
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
      <BudgetFormDialog
        budget={budget}
        open={budgetFormOpen}
        onOpenChange={setBudgetFormOpen}
        renderTrigger={() => null}
      />
      <Dialog
        open={deleteBudgetDialogOpen}
        onOpenChange={(open) => {
          setDeleteBudgetDialogOpen(open);
          if (!open) deleteBudgetMutation.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete budget?')}</DialogTitle>
            <DialogDescription>
              “{budget.name}” {t('will be permanently deleted along with its categories and expenses.')}
            </DialogDescription>
          </DialogHeader>
          {deleteBudgetMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {deleteBudgetMutation.error instanceof Error
                ? t(deleteBudgetMutation.error.message)
                : t('Unable to delete budget.')}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteBudgetDialogOpen(false)}
              disabled={deleteBudgetMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (budgetId) deleteBudgetMutation.mutate(budgetId);
              }}
              disabled={deleteBudgetMutation.isPending}
            >
              {deleteBudgetMutation.isPending ? (
                <>
                  <Spinner />
                  {t('Deleting…')}
                </>
              ) : (
                <>
                  <Trash2 />
                  {t('Delete budget')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
            <DialogTitle>{t('Delete category?')}</DialogTitle>
            <DialogDescription>
              “{deletingCategory?.name}”{' '}
              {t('will be removed from this budget. Categories with expenses cannot be deleted.')}
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {deleteMutation.error instanceof Error
                ? t(deleteMutation.error.message)
                : t('Unable to delete category.')}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCategory(undefined)}
              disabled={deleteMutation.isPending}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deletingCategory) deleteMutation.mutate(deletingCategory.id);
              }}
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
                  {t('Delete category')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
