import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getMonthlyStatistics } from '../lib/statistics-api';
import { useAuth } from './use-auth';

export function useStatisticsQuery(month: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['statistics', user?.id, month],
    queryFn: ({ signal }) => getMonthlyStatistics(month, signal),
    enabled: user !== null,
    placeholderData: keepPreviousData,
  });
}
