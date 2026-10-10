import { describe, expect, it } from '@jest/globals';
import {
  validateCreateBudgetPayload,
  validateUpdateBudgetPayload,
} from '../../src/validators/budget.validator';

describe('budget validators', () => {
  it('accepts a valid create payload and trims the name', () => {
    expect(
      validateCreateBudgetPayload({
        name: '  June  ',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        initialAmount: 10_000,
        currency: 'RUB',
      }),
    ).toEqual({
      name: 'June',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      initialAmount: 10_000,
      currency: 'RUB',
    });
  });

  it.each([
    {
      name: '',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      initialAmount: 0,
      currency: 'RUB',
    },
    {
      name: 'x',
      startDate: '2026-06-31',
      endDate: '2026-07-01',
      initialAmount: 0,
      currency: 'RUB',
    },
    {
      name: 'x',
      startDate: '2026-06-10',
      endDate: '2026-06-01',
      initialAmount: 0,
      currency: 'RUB',
    },
    {
      name: 'x',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      initialAmount: -1,
      currency: 'RUB',
    },
    {
      name: 'x',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      initialAmount: 0,
      currency: 'GBP',
    },
  ])('rejects invalid create payload %#', (body) => {
    expect(() => validateCreateBudgetPayload(body)).toThrow();
  });

  it('requires at least one field on update and rejects unknown ones', () => {
    expect(() => validateUpdateBudgetPayload({})).toThrow();
    expect(() => validateUpdateBudgetPayload({ status: 'archived' })).toThrow();
    expect(validateUpdateBudgetPayload({ name: 'New' })).toEqual({ name: 'New' });
  });

  it('accepts amount and currency fields on update', () => {
    expect(
      validateUpdateBudgetPayload({ initialAmount: 10_000, currency: 'USD' }),
    ).toEqual({ initialAmount: 10_000, currency: 'USD' });
  });

  it.each([
    { initialAmount: -1 },
    { currency: 'GBP' },
  ])('rejects invalid amount or currency on update %#', (body) => {
    expect(() => validateUpdateBudgetPayload(body)).toThrow();
  });
});
