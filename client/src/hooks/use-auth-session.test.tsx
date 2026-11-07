// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthSession } from './use-auth-session';
import { getCurrentUser, login, logout, register, type AuthUser } from '../lib/auth-api';

vi.mock('../lib/auth-api', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}));

const user: AuthUser = { id: 'user-1', email: 'maria@example.com' } as AuthUser;
const credentials = { email: 'maria@example.com', password: 'password123' };

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useAuthSession', () => {
  it('exposes the current user once the session is loaded', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toEqual(user);
  });

  it('treats a failed session lookup as signed out', async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useAuthSession(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('stores the user after signing in and refreshes budgets', async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Unauthorized'));
    vi.mocked(login).mockResolvedValueOnce(user);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signIn(credentials);
    });

    expect(login).toHaveBeenCalledWith(credentials);
    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['budgets'] });
  });

  it('registers and then logs in on sign up', async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Unauthorized'));
    vi.mocked(register).mockResolvedValueOnce(undefined as never);
    vi.mocked(login).mockResolvedValueOnce(user);

    const { result } = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.signUp(credentials);
    });

    expect(register).toHaveBeenCalledWith(credentials);
    expect(login).toHaveBeenCalledWith(credentials);
    await waitFor(() => expect(result.current.user).toEqual(user));
  });

  it('clears the user on sign out', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(user);
    vi.mocked(logout).mockResolvedValueOnce(undefined as never);

    const { result } = renderHook(() => useAuthSession(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(user));

    await act(async () => {
      await result.current.signOut();
    });

    expect(logout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.user).toBeNull());
  });
});
