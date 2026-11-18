import { describe, expect, it } from 'vitest';
import { shiftMonth } from './month';

describe('shiftMonth', () => {
  it('moves across year boundaries in both directions', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-11', 3)).toBe('2027-02');
  });
});
