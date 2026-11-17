import { listMonthlyExpenses, MonthlyExpenseRow } from '../repositories/statistics.repository';

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
  const expenses = await listMonthlyExpenses(userId, monthStart);
  const currencyGroups = new Map<Currency, MonthlyExpenseRow[]>();

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
        buildCurrencyStatistics(currency, currencyExpenses, daysInMonth, month),
      ),
  };
}

function buildCurrencyStatistics(
  currency: Currency,
  expenses: MonthlyExpenseRow[],
  daysInMonth: number,
  month: string,
): MonthlyStatistics['currencies'][number] {
  const total = expenses.reduce((sum, expense) => sum + BigInt(expense.amount), 0n);
  const groupTotals = new Map<string | null, bigint>();
  const dailyTotals = new Map<string, bigint>();

  for (const expense of expenses) {
    const amount = BigInt(expense.amount);
    groupTotals.set(expense.groupSlug, (groupTotals.get(expense.groupSlug) ?? 0n) + amount);
    dailyTotals.set(expense.spentAt, (dailyTotals.get(expense.spentAt) ?? 0n) + amount);
  }

  const sortedExpenses = [...expenses].sort((left, right) => {
    const amountDifference = BigInt(right.amount) - BigInt(left.amount);
    if (amountDifference !== 0n) {
      return amountDifference > 0n ? 1 : -1;
    }
    return right.spentAt.localeCompare(left.spentAt) || left.id.localeCompare(right.id);
  });

  return {
    currency,
    summary: {
      totalAmount: formatAmount(total),
      expenseCount: expenses.length,
      averagePerDay: formatCents(
        (total * 100n + BigInt(Math.floor(daysInMonth / 2))) / BigInt(daysInMonth),
      ),
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
        amount: formatAmount(amount),
        sharePercent: Number((amount * 1000n + total / 2n) / total) / 10,
      })),
    daily: Array.from({ length: daysInMonth }, (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, '0')}`;
      return { date, amount: formatAmount(dailyTotals.get(date) ?? 0n) };
    }),
    topExpenses: sortedExpenses.slice(0, 5).map((expense) => ({
      id: expense.id,
      amount: formatAmount(BigInt(expense.amount)),
      spentAt: expense.spentAt,
      categoryId: expense.categoryId,
      categoryName: expense.categoryName,
      groupSlug: expense.groupSlug,
      note: expense.note,
    })),
  };
}

function formatAmount(amount: bigint): string {
  return `${amount}.00`;
}

function formatCents(cents: bigint): string {
  const whole = cents / 100n;
  const fraction = String(cents % 100n).padStart(2, '0');
  return `${whole}.${fraction}`;
}
