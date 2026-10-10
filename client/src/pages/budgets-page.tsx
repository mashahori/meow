import { useQuery } from '@tanstack/react-query';
import { CalendarDays, WalletCards } from 'lucide-react';
import { CreateBudgetDialog } from '../components/create-budget-dialog';
import { Spinner } from '../components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { getBudgets } from '../lib/budget-api';
import { cn } from '../lib/utils';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export function BudgetsPage() {
  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: getBudgets,
  });

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#eee8fb] text-[#6d43e5]">
            <WalletCards size={21} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a7aa9]">
              Planning
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-[#241c3b]">
              Budgets
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#888198]">
              All your budgeting periods in one place.
            </p>
          </div>
        </div>
        <CreateBudgetDialog />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {budgetsQuery.isPending ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm font-medium text-muted-foreground">
            <Spinner className="size-5 text-primary" aria-label="Loading budgets" />
            Loading budgets…
          </div>
        ) : null}

        {budgetsQuery.isError ? (
          <p role="alert" className="p-6 text-sm font-medium text-destructive">
            {budgetsQuery.error instanceof Error
              ? budgetsQuery.error.message
              : 'Unable to load budgets.'}
          </p>
        ) : null}

        {budgetsQuery.data?.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <CalendarDays className="size-9 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              No budgets yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your budgets will appear here once they are created.
            </p>
          </div>
        ) : null}

        {budgetsQuery.data && budgetsQuery.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>End date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budgetsQuery.data.map((budget) => (
                <TableRow
                  key={budget.id}
                  className={cn(budget.isActive && 'bg-violet-50 hover:bg-violet-100/70')}
                >
                  <TableCell className="font-semibold text-foreground">
                    <span className="flex items-center gap-3">
                      {budget.name}
                      {budget.isActive ? (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          Active
                        </span>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(budget.startDate)}</TableCell>
                  <TableCell>{formatDate(budget.endDate)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </section>
  );
}
