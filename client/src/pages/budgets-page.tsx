import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Ellipsis, Pencil, Trash2, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from '@base-ui/react/menu';
import { BudgetFormDialog, CreateBudgetDialog } from '../components/create-budget-dialog';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Spinner } from '../components/ui/spinner';
import { deleteBudget, getBudgets, type Budget } from '../lib/budget-api';
import { useAuth } from '../hooks/use-auth';
import { useTranslation } from '../contexts/language-context';

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function getErrorMessage(error: unknown, t: (text: string) => string) {
  return error instanceof Error ? t(error.message) : t('Unable to delete budget.');
}

function BudgetCard({ budget }: { budget: Budget }) {
  const { t, locale } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => deleteBudget(budget.id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['budgets'] }),
        queryClient.invalidateQueries({ queryKey: ['budget', budget.id] }),
      ]);
      setDeleteDialogOpen(false);
    },
  });

  return (
    <article className="relative flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-gray-300 focus-within:ring-2 focus-within:ring-ring">
      <Menu.Root>
        <Menu.Trigger
          aria-label={`${t('Actions for')} ${budget.name}`}
          render={<Button variant="ghost" size="icon-sm" className="absolute right-3 top-3" />}
        >
          <Ellipsis aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="end" className="z-50">
            <Menu.Popup className="min-w-40 rounded-lg border border-border bg-white p-1 shadow-lg outline-none">
              <Menu.Item
                onClick={() => setEditDialogOpen(true)}
                className="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-highlighted:bg-muted"
              >
                <Pencil className="size-4" aria-hidden="true" />
                {t('Edit')}
              </Menu.Item>
              <Menu.Item
                onClick={() => {
                  deleteMutation.reset();
                  setDeleteDialogOpen(true);
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

      <BudgetFormDialog
        budget={budget}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        renderTrigger={() => null}
      />

      <Link
        to={`/budgets/${budget.id}`}
        className="flex min-h-0 flex-1 flex-col justify-between rounded-md pr-1 focus-visible:outline-none"
      >
        <div className="flex items-start gap-3 pr-8">
          <div className="min-w-0 flex-1">
            <h2 className="break-words font-display text-xl font-semibold text-foreground">
              {budget.name}
            </h2>
            {budget.isActive ? (
              <span className="mt-2 inline-flex rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                {t('Active')}
              </span>
            ) : budget.status === 'archived' ? (
              <span className="mt-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {t('Archived')}
              </span>
            ) : null}
          </div>
        </div>

        <dl className="flex justify-between mt-12 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <dt className="text-muted-foreground">{t('Start date')}</dt>
            <dd className="mt-1 font-medium text-foreground">{formatDate(budget.startDate, locale)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t('End date')}</dt>
            <dd className="mt-1 font-medium text-foreground">{formatDate(budget.endDate, locale)}</dd>
          </div>
        </dl>
      </Link>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) deleteMutation.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Delete budget?')}</DialogTitle>
            <DialogDescription>
                “{budget.name}” {t('will be archived and remain available in your budget history.')}
            </DialogDescription>
          </DialogHeader>
          {deleteMutation.isError ? (
            <p role="alert" className="mb-4 text-sm font-medium text-destructive">
              {getErrorMessage(deleteMutation.error, t)}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
                  {t('Delete budget')}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function BudgetsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const budgetsQuery = useQuery({
    queryKey: ['budgets', user?.id],
    queryFn: ({ signal }) => getBudgets(signal),
    enabled: user !== null,
  });

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#f8f8f8] text-[#4b5563]">
            <WalletCards size={21} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#737373]">
              {t('Planning')}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-[#262626]">
              {t('Budgets')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#737373]">
              {t('All your budgeting periods in one place.')}
            </p>
          </div>
        </div>
        <CreateBudgetDialog />
      </div>

      <div className="mt-8">
        {budgetsQuery.isPending ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-sm">
            <Spinner className="size-5 text-primary" aria-label={t('Loading budgets')} />
            {t('Loading budgets…')}
          </div>
        ) : null}

        {budgetsQuery.isError ? (
          <p
            role="alert"
            className="rounded-xl border border-border bg-card p-6 text-sm font-medium text-destructive shadow-sm"
          >
            {budgetsQuery.error instanceof Error
              ? t(budgetsQuery.error.message)
              : t('Unable to load budgets.')}
          </p>
        ) : null}

        {budgetsQuery.data?.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card px-6 text-center shadow-sm">
            <CalendarDays className="size-9 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              {t('No budgets yet')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('Your budgets will appear here once they are created.')}
            </p>
          </div>
        ) : null}

        {budgetsQuery.data && budgetsQuery.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgetsQuery.data.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
