import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { listMonthlyExpenses } from '../../src/repositories/statistics.repository';
import { setupTestServer, signIn, TEST_USER_ID, TestClient } from './route-helpers';

jest.mock('../../src/config/session', () => {
  const session = jest.requireActual('express-session') as typeof import('express-session');
  return {
    sessionMiddleware: session({
      name: 'sid',
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
    }),
  };
});

jest.mock('../../src/repositories/statistics.repository');
jest.mock('../../src/repositories/user.repository');

const EXPENSE_ID = 'b1d2c3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
const CATEGORY_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('statistics routes', () => {
  const newClient = setupTestServer();
  let client: TestClient;

  beforeEach(async () => {
    client = newClient();
    await signIn(client);
  });

  it('returns monthly totals and breakdowns by currency', async () => {
    jest.mocked(listMonthlyExpenses).mockResolvedValue([
      {
        id: EXPENSE_ID,
        amount: '84000',
        spentAt: '2026-11-01',
        currency: 'RUB',
        categoryId: CATEGORY_ID,
        categoryName: 'Аренда',
        groupSlug: 'rent',
        note: null,
      },
      {
        id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
        amount: '350',
        spentAt: '2026-11-30',
        currency: 'RUB',
        categoryId: CATEGORY_ID,
        categoryName: 'Аренда',
        groupSlug: 'rent',
        note: null,
      },
      {
        id: 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a',
        amount: '10',
        spentAt: '2026-11-30',
        currency: 'USD',
        categoryId: CATEGORY_ID,
        categoryName: 'Транспорт',
        groupSlug: 'transport',
        note: 'Taxi',
      },
    ]);

    const response = await client.get('/api/statistics?month=2026-11');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      month: '2026-11',
      currencies: [
        {
          currency: 'RUB',
          summary: {
            totalAmount: '84350.00',
            expenseCount: 2,
            averagePerDay: '2811.67',
          },
          groups: [{ slug: 'rent', amount: '84350.00', sharePercent: 100 }],
          daily: expect.arrayContaining([
            { date: '2026-11-01', amount: '84000.00' },
            { date: '2026-11-30', amount: '350.00' },
          ]),
          topExpenses: [
            {
              id: EXPENSE_ID,
              amount: '84000.00',
              spentAt: '2026-11-01',
              categoryId: CATEGORY_ID,
              categoryName: 'Аренда',
              groupSlug: 'rent',
              note: null,
            },
            {
              id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
              amount: '350.00',
              spentAt: '2026-11-30',
              categoryId: CATEGORY_ID,
              categoryName: 'Аренда',
              groupSlug: 'rent',
              note: null,
            },
          ],
        },
        {
          currency: 'USD',
          summary: {
            totalAmount: '10.00',
            expenseCount: 1,
            averagePerDay: '0.33',
          },
          groups: [{ slug: 'transport', amount: '10.00', sharePercent: 100 }],
          daily: expect.any(Array),
          topExpenses: [
            {
              id: 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a',
              amount: '10.00',
              spentAt: '2026-11-30',
              categoryId: CATEGORY_ID,
              categoryName: 'Транспорт',
              groupSlug: 'transport',
              note: 'Taxi',
            },
          ],
        },
      ],
    });
    expect(
      (response.body as { currencies: { daily: unknown[] }[] }).currencies[0].daily,
    ).toHaveLength(30);
    expect(listMonthlyExpenses).toHaveBeenCalledWith(TEST_USER_ID, '2026-11-01');
  });

  it('keeps cent precision for decimal amounts', async () => {
    jest.mocked(listMonthlyExpenses).mockResolvedValue([
      {
        id: EXPENSE_ID,
        amount: '1234.56',
        spentAt: '2026-11-05',
        currency: 'RUB',
        categoryId: CATEGORY_ID,
        categoryName: 'Продукты',
        groupSlug: 'food',
        note: null,
      },
      {
        id: 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
        amount: '0.1',
        spentAt: '2026-11-05',
        currency: 'RUB',
        categoryId: CATEGORY_ID,
        categoryName: 'Продукты',
        groupSlug: 'food',
        note: null,
      },
    ]);

    const response = await client.get('/api/statistics?month=2026-11');

    expect(response.status).toBe(200);
    const [currency] = (response.body as { currencies: Record<string, unknown>[] }).currencies;
    expect(currency).toMatchObject({
      summary: { totalAmount: '1234.66', expenseCount: 2, averagePerDay: '41.16' },
      groups: [{ slug: 'food', amount: '1234.66', sharePercent: 100 }],
      daily: expect.arrayContaining([{ date: '2026-11-05', amount: '1234.66' }]),
      topExpenses: [
        expect.objectContaining({ amount: '1234.56' }),
        expect.objectContaining({ amount: '0.10' }),
      ],
    });
  });

  it('returns zero shares when all expenses in a currency are zero', async () => {
    jest.mocked(listMonthlyExpenses).mockResolvedValue([
      {
        id: EXPENSE_ID,
        amount: '0',
        spentAt: '2026-11-10',
        currency: 'RUB',
        categoryId: CATEGORY_ID,
        categoryName: 'Продукты',
        groupSlug: 'food',
        note: null,
      },
    ]);

    const response = await client.get('/api/statistics?month=2026-11');

    expect(response.status).toBe(200);
    const [currency] = (response.body as { currencies: Record<string, unknown>[] }).currencies;
    expect(currency).toMatchObject({
      summary: { totalAmount: '0.00', expenseCount: 1, averagePerDay: '0.00' },
      groups: [{ slug: 'food', amount: '0.00', sharePercent: 0 }],
    });
  });

  it('rejects invalid months', async () => {
    const response = await client.get('/api/statistics?month=2026-13');

    expect(response.status).toBe(400);
    expect(listMonthlyExpenses).not.toHaveBeenCalled();
  });

  it('requires authentication', async () => {
    const response = await newClient().get('/api/statistics?month=2026-11');

    expect(response.status).toBe(401);
    expect(listMonthlyExpenses).not.toHaveBeenCalled();
  });
});
