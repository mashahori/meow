// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatePickerField } from './date-picker-field';

const translation = vi.hoisted(() => ({ language: 'en' }));

vi.mock('../contexts/language-context', () => ({
  useTranslation: () => ({ t: (text: string) => text, language: translation.language }),
}));

function renderField(onChange = vi.fn(), value = '2026-11-05') {
  render(
    <DatePickerField
      id="test-date"
      label="Date"
      value={value}
      onChange={onChange}
      min="2026-11-02"
      max="2026-11-20"
    />,
  );
  return onChange;
}

describe('DatePickerField', () => {
  afterEach(() => {
    cleanup();
    translation.language = 'en';
  });

  it('shows the value as DD.MM.YYYY and reports the picked day as an ISO date', async () => {
    const onChange = renderField();

    const trigger = screen.getByRole('button', { name: 'Date' });
    expect(trigger.textContent).toContain('05.11.2026');

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: /November 12(?!\d)/ }));

    expect(onChange).toHaveBeenCalledWith('2026-11-12');
  });

  it('disables days outside the min and max range', async () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'Date' }));
    const dayBeforeMin = await screen.findByRole('button', { name: /November 1(?!\d)/ });
    const dayAfterMax = await screen.findByRole('button', { name: /November 21(?!\d)/ });

    expect(dayBeforeMin.hasAttribute('disabled')).toBe(true);
    expect(dayAfterMax.hasAttribute('disabled')).toBe(true);
  });

  it('localizes the calendar for Russian and starts weeks on Monday', async () => {
    translation.language = 'ru';
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'Date' }));

    expect(await screen.findByText(/ноябрь 2026/i)).toBeTruthy();
    const weekdays = [...document.querySelectorAll('.rdp-weekday')].map((cell) => cell.textContent);
    expect(weekdays[0]).toMatch(/^пн/i);
  });

  it('shows a placeholder instead of an invalid date when the value is empty', async () => {
    const onChange = renderField(vi.fn(), '');

    const trigger = screen.getByRole('button', { name: 'Date' });
    expect(trigger.textContent).toContain('Select a date');

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: /November 12(?!\d)/ }));

    expect(onChange).toHaveBeenCalledWith('2026-11-12');
  });
});
