import {
  CalendarDays,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import { useTranslation } from '../contexts/language-context';
import { useStatisticsQuery } from '../hooks/use-statistics';
import { getCategoryGroupName } from '../lib/category-groups';
import { formatDate } from '../lib/date-format';
import { formatMonthLabel, getCurrentMonth, shiftMonth } from '../lib/month';
import { formatNumberWithSpaceGrouping } from '../lib/number-format';
import type { CurrencyStatistics } from '../lib/statistics-api';

function formatMoney(amount: string | number, currency: string, locale: string) {
  return formatNumberWithSpaceGrouping(amount, locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#8b5cf6', '#14b8a6', '#ec4899', '#94a3b8'];

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <span className="grid size-10 place-items-center rounded-lg bg-muted text-primary">
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-foreground">
        {value}
        {hint ? <span className="ml-2 text-sm font-medium text-muted-foreground">· {hint}</span> : null}
      </p>
    </div>
  );
}

export function StatisticsPage() {
  const { t, locale } = useTranslation();
  const [month, setMonth] = useState(getCurrentMonth);
  const [selectedCurrency, setSelectedCurrency] = useState<string>();
  const statisticsQuery = useStatisticsQuery(month);
  const currencies = statisticsQuery.data?.currencies ?? [];
  const stats: CurrencyStatistics | undefined =
    currencies.find((item) => item.currency === selectedCurrency) ?? currencies[0];

  const monthSwitcher = (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('Previous month')}
        onClick={() => setMonth((current) => shiftMonth(current, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium text-foreground">
        {formatMonthLabel(month, locale)}
      </span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={t('Next month')}
        onClick={() => setMonth((current) => shiftMonth(current, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );

  let content;
  if (statisticsQuery.isPending) {
    content = (
      <div className="flex min-h-64 items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-sm">
        <Spinner className="size-5 text-primary" aria-label={t('Loading statistics')} />
        {t('Loading statistics…')}
      </div>
    );
  } else if (statisticsQuery.isError) {
    content = (
      <p
        role="alert"
        className="rounded-xl border border-border bg-card p-6 text-sm font-medium text-destructive shadow-sm"
      >
        {statisticsQuery.error instanceof Error
          ? t(statisticsQuery.error.message)
          : t('Unable to load statistics.')}
      </p>
    );
  } else if (!stats) {
    content = (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-border bg-card px-6 text-center shadow-sm">
        <ChartNoAxesColumn className="size-9 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
          {t('No expenses for this month')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('Expenses from all your budgets for the selected month will appear here.')}
        </p>
      </div>
    );
  } else {
    const { currency } = stats;
    const [largestExpense] = stats.topExpenses;
    const percentFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const groupChartData = stats.groups.map((group, index) => ({
      key: group.slug ?? 'other',
      name: group.slug ? t(getCategoryGroupName(group.slug)) : t('Other'),
      value: Number(group.amount),
      amount: group.amount,
      percent: group.sharePercent,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
    const dailyChartData = stats.daily.map((day) => ({
      date: day.date,
      amount: Number(day.amount),
    }));

    content = (
      <div className="space-y-5">
        {currencies.length > 1 ? (
          <div role="group" aria-label={t('Currency')} className="flex gap-2">
            {currencies.map((item) => (
              <Button
                key={item.currency}
                type="button"
                size="sm"
                variant={item.currency === currency ? 'default' : 'outline'}
                aria-pressed={item.currency === currency}
                onClick={() => setSelectedCurrency(item.currency)}
              >
                {item.currency}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm text-muted-foreground">{t('Spent for the month')}</p>
            <p className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-foreground">
              {formatMoney(stats.summary.totalAmount, currency, locale)}
            </p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-muted text-primary">
            <Wallet size={22} aria-hidden="true" />
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={CalendarDays}
            label={t('On average per day')}
            value={formatMoney(stats.summary.averagePerDay, currency, locale)}
          />
          <StatCard
            icon={Receipt}
            label={t('Total expenses')}
            value={String(stats.summary.expenseCount)}
          />
          <StatCard
            icon={Star}
            label={t('Largest expense')}
            value={largestExpense ? formatMoney(largestExpense.amount, currency, locale) : '—'}
            hint={largestExpense?.categoryName}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t('Share of expenses')}
            </h2>
            <div className="relative mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="90%"
                    paddingAngle={1}
                    stroke="#ffffff"
                    isAnimationActive={false}
                  >
                    {groupChartData.map((group) => (
                      <Cell key={group.key} fill={group.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value), currency, locale)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-lg font-semibold text-foreground">
                  {formatMoney(stats.summary.totalAmount, currency, locale)}
                </span>
                <span className="text-xs text-primary">{t('total')}</span>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {groupChartData.map((group) => (
                <li key={group.key} className="flex items-center justify-between gap-4 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: group.color }}
                      aria-hidden="true"
                    />
                    {group.name}
                  </span>
                  <span className="text-muted-foreground">
                    {percentFormatter.format(group.percent)}%
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t('Expenses by groups')}
            </h2>
            <ul className="mt-4">
              {groupChartData.map((group) => (
                <li
                  key={group.key}
                  className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0"
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: group.color }}
                      aria-hidden="true"
                    />
                    {group.name}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatMoney(group.amount, currency, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-5">
          <section className="rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t('Expenses by days')}
            </h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value: string) => String(Number(value.slice(8)))}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={72}
                    tickFormatter={(value: number) => formatNumberWithSpaceGrouping(value, locale)}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatDate(String(label))}
                    formatter={(value) => formatMoney(Number(value), currency, locale)}
                  />
                  <Bar
                    dataKey="amount"
                    fill="#3b82f6"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-display text-lg font-semibold text-foreground">
              {t('Top large expenses')}
            </h2>
            <ul className="mt-4">
              {stats.topExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {expense.note || t('Expense')}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDate(expense.spentAt)} · {expense.categoryName}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatMoney(expense.amount, currency, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('Planning')}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-foreground">
            {t('Statistics')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('Expenses across all your budgets for the selected month.')}
          </p>
        </div>
        {monthSwitcher}
      </div>

      <div className="mt-8">{content}</div>
    </section>
  );
}
