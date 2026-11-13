import { describe, expect, it } from 'vitest';
import { formatDate } from './date-format';

describe('formatDate', () => {
  it('formats ISO date strings as DD.MM.YYYY', () => {
    expect(formatDate('2026-11-05')).toBe('05.11.2026');
  });

  it('keeps the calendar day regardless of timezone', () => {
    expect(formatDate('2026-01-01')).toBe('01.01.2026');
    expect(formatDate('2026-12-31')).toBe('31.12.2026');
  });
});
