import { z } from 'zod';
import { requestJson } from './api-client';

const statisticsSchema = z.object({
  month: z.string(),
  currencies: z.array(
    z.object({
      currency: z.enum(['RUB', 'USD', 'EUR']),
      summary: z.object({
        totalAmount: z.string(),
        expenseCount: z.number(),
        averagePerDay: z.string(),
      }),
      groups: z.array(
        z.object({
          slug: z.string().nullable(),
          amount: z.string(),
          sharePercent: z.number(),
        }),
      ),
      groupPlans: z.array(
        z.object({
          slug: z.string().nullable(),
          plannedAmount: z.string(),
          spentAmount: z.string(),
        }),
      ),
      daily: z.array(
        z.object({
          date: z.string().date(),
          amount: z.string(),
        }),
      ),
      topExpenses: z.array(
        z.object({
          id: z.string().uuid(),
          amount: z.string(),
          spentAt: z.string().date(),
          categoryId: z.string().uuid(),
          categoryName: z.string(),
          groupSlug: z.string().nullable(),
          note: z.string().nullable(),
        }),
      ),
    }),
  ),
});

export type MonthlyStatistics = z.infer<typeof statisticsSchema>;
export type CurrencyStatistics = MonthlyStatistics['currencies'][number];

export function getMonthlyStatistics(
  month: string,
  signal?: AbortSignal,
): Promise<MonthlyStatistics> {
  const params = new URLSearchParams({ month });
  return requestJson(
    `/api/statistics?${params.toString()}`,
    statisticsSchema,
    'Unable to load statistics',
    { signal },
  );
}
