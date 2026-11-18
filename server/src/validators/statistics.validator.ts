import { z } from 'zod';

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must be YYYY-MM')
  .refine((value) => Number(value.slice(0, 4)) > 0, 'Invalid month');

const statisticsQuerySchema = z.object({
  month: monthSchema,
});

export type StatisticsQuery = z.infer<typeof statisticsQuerySchema>;

export function validateStatisticsQuery(query: unknown): StatisticsQuery {
  return statisticsQuerySchema.parse(query);
}
