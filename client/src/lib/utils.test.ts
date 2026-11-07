import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names and skips falsy values', () => {
    expect(cn('text-sm', false, null, undefined, 'font-bold')).toBe('text-sm font-bold');
  });

  it('resolves conflicting Tailwind classes, keeping the last one', () => {
    expect(cn('p-2 text-red-500', 'p-4', { 'text-blue-500': true })).toBe('p-4 text-blue-500');
  });
});
