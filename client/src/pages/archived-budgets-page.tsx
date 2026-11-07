import { Archive } from 'lucide-react';
import { useBudgetsQuery } from '../hooks/use-budgets';
import { useTranslation } from '../contexts/language-context';
import { Spinner } from '../components/ui/spinner';
import { BudgetCard } from './budgets-page';

export function ArchivedBudgetsPage() {
  const { t } = useTranslation();
  const budgetsQuery = useBudgetsQuery();
  const archivedBudgets = budgetsQuery.data?.filter((budget) => budget.status === 'archived');

  return (
    <section className="mx-auto max-w-5xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {t('Planning')}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
          {t('Budget archive')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {t('Budgets you have moved to the archive.')}
        </p>
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

        {archivedBudgets?.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card px-6 text-center shadow-sm">
            <Archive className="size-9 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              {t('No archived budgets')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('Budgets moved to the archive will appear here.')}
            </p>
          </div>
        ) : null}

        {archivedBudgets && archivedBudgets.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archivedBudgets.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
