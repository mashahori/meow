import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMonthlyStatistics } from './statistics-api';

const fetchMock = vi.fn();

const response = {
  month: '2026-11',
  currencies: [
    {
      currency: 'RUB',
      summary: { totalAmount: '84350.00', expenseCount: 2, averagePerDay: '2811.67' },
      groups: [{ slug: null, amount: '84350.00', sharePercent: 100 }],
      daily: [{ date: '2026-11-01', amount: '84000.00' }],
      topExpenses: [
        {
          id: '33333333-3333-4333-8333-333333333333',
          amount: '84000.00',
          spentAt: '2026-11-01',
          categoryId: '22222222-2222-4222-8222-222222222222',
          categoryName: 'Аренда',
          groupSlug: 'rent',
          note: null,
        },
      ],
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('statistics API', () => {
  it('requests the statistics of the given month and parses the response', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(response)));

    await expect(getMonthlyStatistics('2026-11')).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('/api/statistics?month=2026-11', {
      credentials: 'include',
    });
  });
});
