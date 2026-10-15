import { describe, expect, it } from '@jest/globals';
import {
  validateCreateExpensePayload,
  validateUpdateExpensePayload,
} from '../../src/validators/expense.validator';

const categoryId = '3f2504e0-e89b-41d4-a716-446655440000';

describe('expense validators', () => {
  it('accepts positive decimal string amounts and trims notes', () => {
    expect(
      validateCreateExpensePayload({
        categoryId,
        amount: '0.50',
        spentAt: '2026-06-15',
        note: '  Weekly shopping  ',
      }),
    ).toEqual({
      categoryId,
      amount: '0.50',
      spentAt: '2026-06-15',
      note: 'Weekly shopping',
    });
  });

  it.each(['0', '0.00', '-1.00', '1.001', 100, '10000000000.00'])(
    'rejects invalid amount %p',
    (amount) => {
      expect(() =>
        validateCreateExpensePayload({
          categoryId,
          amount,
          spentAt: '2026-06-15',
        }),
      ).toThrow();
    },
  );

  it('allows clearing a note during updates', () => {
    expect(validateUpdateExpensePayload({ note: null })).toEqual({
      note: null,
    });
  });

  it('rejects invalid dates and empty updates', () => {
    expect(() =>
      validateCreateExpensePayload({
        categoryId,
        amount: '10.00',
        spentAt: '2026-02-30',
      }),
    ).toThrow();
    expect(() => validateUpdateExpensePayload({})).toThrow();
  });
});
