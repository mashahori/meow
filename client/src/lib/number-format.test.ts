import { describe, expect, it } from 'vitest';
import { formatNumberWithSpaceGrouping } from './number-format';

describe('formatNumberWithSpaceGrouping', () => {
  it('groups thousands with a plain space regardless of locale separator', () => {
    expect(formatNumberWithSpaceGrouping(1234567, 'ru-RU')).toBe('1 234 567');
  });

  it('accepts numeric strings', () => {
    expect(formatNumberWithSpaceGrouping('98765.5', 'en-US', { maximumFractionDigits: 1 })).toBe(
      '98 765.5',
    );
  });

  it('keeps small numbers without grouping', () => {
    expect(formatNumberWithSpaceGrouping(42, 'en-US')).toBe('42');
  });
});
