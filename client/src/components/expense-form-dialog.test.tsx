// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Expense } from '../lib/expense-api';
import { ExpenseFormDialog } from './expense-form-dialog';

const mutate = vi.fn();
const resetMutation = vi.fn();

vi.mock('../contexts/language-context', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

vi.mock('../hooks/use-expenses', () => ({
  useSaveExpenseMutation: () => ({
    mutate,
    reset: resetMutation,
    isPending: false,
    isError: false,
  }),
}));

const expense: Expense = {
  id: '22222222-2222-4222-8222-222222222222',
  budgetId: '11111111-1111-4111-8111-111111111111',
  categoryId: '33333333-3333-4333-8333-333333333333',
  amount: '150',
  spentAt: '2026-11-05',
  note: null,
};

function renderDialog() {
  return render(
    <ExpenseFormDialog
      budgetId={expense.budgetId}
      categoryId={expense.categoryId}
      categories={[]}
      startDate="2026-11-10"
      endDate="2026-11-30"
      currency="RUB"
      expense={expense}
      open
      onOpenChange={vi.fn()}
    />,
  );
}

describe('ExpenseFormDialog date picker', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('saves the day picked in the calendar as an ISO date', async () => {
    renderDialog();

    fireEvent.click(screen.getByRole('button', { name: 'Date' }));
    fireEvent.click(await screen.findByRole('button', { name: /November 12(?!\d)/ }));

    expect(screen.getByRole('button', { name: 'Date' }).textContent).toContain('12.11.2026');
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ spentAt: '2026-11-12' })),
    );
  });
});
