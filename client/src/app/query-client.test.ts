import { afterEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from './query-client';

describe('queryClient', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs failed queries to the browser console', async () => {
    const error = new Error('Query failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      queryClient.fetchQuery({
        queryKey: ['query-error-test'],
        queryFn: async () => {
          throw error;
        },
        retry: false,
      }),
    ).rejects.toBe(error);

    expect(consoleError).toHaveBeenCalledWith('Query failed:', error);
  });

  it('logs failed mutations to the browser console', async () => {
    const error = new Error('Mutation failed');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mutation = queryClient.getMutationCache().build(queryClient, {
      mutationFn: async () => {
        throw error;
      },
    });

    await expect(mutation.execute(undefined)).rejects.toBe(error);

    expect(consoleError).toHaveBeenCalledWith('Mutation failed:', error);
  });
});
