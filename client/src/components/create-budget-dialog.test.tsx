// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetFormDialog } from './create-budget-dialog';

const mutate = vi.fn();
const resetMutation = vi.fn();

vi.mock('../contexts/language-context', () => ({
  useTranslation: () => ({ t: (text: string) => text }),
}));

vi.mock('../hooks/use-budgets', () => ({
  useSaveBudgetMutation: () => ({
    mutate,
    reset: resetMutation,
    isPending: false,
    isError: false,
  }),
}));

describe('BudgetFormDialog date picker', () => {
  beforeEach(() => {
    mutate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('submits the start date picked in the calendar as an ISO date', async () => {
    render(<BudgetFormDialog open onOpenChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Budget name'), { target: { value: 'Groceries' } });
    fireEvent.change(screen.getByLabelText('Starting amount'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start date' }));
    fireEvent.click(await screen.findByRole('button', { name: /November 12(?!\d)/ }));

    expect(screen.getByRole('button', { name: 'Start date' }).textContent).toContain('12.11.2026');
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create budget' }));
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-11-12' })),
    );
  });
});
