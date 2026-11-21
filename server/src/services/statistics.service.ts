import {
  listMonthlyExpenses,
  listMonthlyGroupPlans,
  MonthlyExpenseRow,
} from '../repositories/statistics.repository';

type Currency = MonthlyExpenseRow['currency'];

type MonthlyStatistics = {
  month: string;
  currencies: {
    currency: Currency;
    summary: {
      totalAmount: string;
      expenseCount: number;
      averagePerDay: string;
    };
    groups: {
      slug: string | null;
      amount: string;
      sharePercent: number;
    }[];
    groupPlans: {
      slug: string | null;
      plannedAmount: string;
      spentAmount: string;
    }[];
    daily: {
      date: string;
      amount: string;
    }[];
    topExpenses: {
      id: string;
      amount: string;
      spentAt: string;
      categoryId: string;
      categoryName: string;
      groupSlug: string | null;
      note: string | null;
    }[];
  }[];
};

export async function getMonthlyStatistics(
  userId: string,
  month: string,
): Promise<MonthlyStatistics> {
  const monthStart = `${month}-01`;
  const [year, monthNumber] = month.split('-').map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const [expenses, groupPlans] = await Promise.all([
    listMonthlyExpenses(userId, monthStart),
    listMonthlyGroupPlans(userId, monthStart),
  ]);
  const currencyGroups = new Map<Currency, MonthlyExpenseRow[]>();
  const currencyPlans = new Map<Currency, GroupAmounts>();

  for (const plan of groupPlans) {
    const plans = currencyPlans.get(plan.currency) ?? new Map<string | null, bigint>();
    plans.set(plan.groupSlug, toCents(plan.plannedAmount));
    currencyPlans.set(plan.currency, plans);
  }

  for (const expense of expenses) {
    const currencyExpenses = currencyGroups.get(expense.currency) ?? [];
    currencyExpenses.push(expense);
    currencyGroups.set(expense.currency, currencyExpenses);
  }

  return {
    month,
    currencies: [...currencyGroups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([currency, currencyExpenses]) =>
        buildCurrencyStatistics(
          currency,
          currencyExpenses,
          currencyPlans.get(currency) ?? new Map<string | null, bigint>(),
          daysInMonth,
          month,
        ),
      ),
  };
}

type GroupAmounts = Map<string | null, bigint>;

function buildGroupPlans(
  plans: GroupAmounts,
  spent: GroupAmounts,
): MonthlyStatistics['currencies'][number]['groupPlans'] {
  return [...new Set([...plans.keys(), ...spent.keys()])]
    .map((slug) => ({ slug, planned: plans.get(slug) ?? 0n, spent: spent.get(slug) ?? 0n }))
    .filter((group) => group.planned > 0n || group.spent > 0n)
    .sort((left, right) => {
      if (left.planned !== right.planned) {
        return left.planned > right.planned ? -1 : 1;
      }
      if (left.spent !== right.spent) {
        return left.spent > right.spent ? -1 : 1;
      }
      return (left.slug ?? 'other').localeCompare(right.slug ?? 'other');
    })
    .map((group) => ({
      slug: group.slug,
      plannedAmount: formatCents(group.planned),
      spentAmount: formatCents(group.spent),
    }));
}

function buildCurrencyStatistics(
  currency: Currency,
  expenses: MonthlyExpenseRow[],
  plans: GroupAmounts,
  daysInMonth: number,
  month: string,
): MonthlyStatistics['currencies'][number] {
  const total = expenses.reduce((sum, expense) => sum + toCents(expense.amount), 0n);
  const groupTotals = new Map<string | null, bigint>();
  const dailyTotals = new Map<string, bigint>();

  for (const expense of expenses) {
    const amount = toCents(expense.amount);
    groupTotals.set(expense.groupSlug, (groupTotals.get(expense.groupSlug) ?? 0n) + amount);
    dailyTotals.set(expense.spentAt, (dailyTotals.get(expense.spentAt) ?? 0n) + amount);
  }

  const sortedExpenses = [...expenses].sort((left, right) => {
    const amountDifference = toCents(right.amount) - toCents(left.amount);
    if (amountDifference !== 0n) {
      return amountDifference > 0n ? 1 : -1;
    }
    return right.spentAt.localeCompare(left.spentAt) || left.id.localeCompare(right.id);
  });

  return {
    currency,
    summary: {
      totalAmount: formatCents(total),
      expenseCount: expenses.length,
      averagePerDay: formatCents(roundedDivide(total, BigInt(daysInMonth))),
    },
    groups: [...groupTotals.entries()]
      .sort(([leftSlug, leftAmount], [rightSlug, rightAmount]) => {
        if (leftAmount !== rightAmount) {
          return leftAmount > rightAmount ? -1 : 1;
        }
        return (leftSlug ?? 'other').localeCompare(rightSlug ?? 'other');
      })
      .map(([slug, amount]) => ({
        slug,
        amount: formatCents(amount),
        sharePercent: total === 0n ? 0 : Number((amount * 1000n + total / 2n) / total) / 10,
      })),
    groupPlans: buildGroupPlans(plans, groupTotals),
    daily: Array.from({ length: daysInMonth }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      return { date, amount: formatCents(dailyTotals.get(date) ?? 0n) };
    }),
    topExpenses: sortedExpenses.slice(0, 5).map((expense) => ({
      id: expense.id,
      amount: formatCents(toCents(expense.amount)),
      spentAt: expense.spentAt,
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
      groupSlug: expense.groupSlug,
      note: expense.note,
    })),
  };
}

function toCents(amount: string): bigint {
  const match = /^(\d+)(?:\.(\d+))?$/.exec(amount);
  if (!match) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const [, whole, fraction = ''] = match;
  const cents = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2).padEnd(2, '0'));
  return fraction.charAt(2) >= '5' ? cents + 1n : cents;
}

function roundedDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator * 2n + denominator) / (denominator * 2n);
}

function formatCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = String(cents % 100n).padStart(2, '0');
  return `${whole}.${fraction}`;
}
