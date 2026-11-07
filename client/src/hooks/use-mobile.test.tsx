// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsMobile } from './use-mobile';

type Listener = (event: { matches: boolean }) => void;

let matches = false;
let listeners: Listener[] = [];

beforeEach(() => {
  matches = false;
  listeners = [];
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      get matches() {
        return matches;
      },
      media: query,
      addEventListener: (_type: string, listener: Listener) => listeners.push(listener),
      removeEventListener: (_type: string, listener: Listener) => {
        listeners = listeners.filter((item) => item !== listener);
      },
    })),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIsMobile', () => {
  it('returns false on desktop widths', () => {
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 767px)');
  });

  it('updates when the viewport crosses the breakpoint', () => {
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      matches = true;
      listeners.forEach((listener) => listener({ matches: true }));
    });

    expect(result.current).toBe(true);
  });

  it('removes its media query listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners).toHaveLength(1);

    unmount();

    expect(listeners).toHaveLength(0);
  });
});
