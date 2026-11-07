import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AuthContextValue } from '../contexts/auth-context-value';
import {
  getCurrentUser,
  login,
  logout,
  register,
  type AuthUser,
  type Credentials,
} from '../lib/auth-api';

const currentUserKey = ['auth', 'current-user'] as const;

export function useAuthSession(): AuthContextValue {
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery({
    queryKey: currentUserKey,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
    staleTime: 60_000,
  });
  const signInMutation = useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: async (user) => {
      await queryClient.cancelQueries({ queryKey: currentUserKey });
      queryClient.setQueryData(currentUserKey, user);
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
  const signUpMutation = useMutation({
    mutationFn: async (credentials: Credentials): Promise<AuthUser> => {
      await register(credentials);
      return login(credentials);
    },
    onSuccess: async (user) => {
      await queryClient.cancelQueries({ queryKey: currentUserKey });
      queryClient.setQueryData(currentUserKey, user);
      await queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
  const signOutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: currentUserKey });
      queryClient.setQueryData(currentUserKey, null);
    },
  });

  return useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isLoading: currentUserQuery.isPending,
      signIn: async (credentials) => {
        await signInMutation.mutateAsync(credentials);
      },
      signUp: async (credentials) => {
        await signUpMutation.mutateAsync(credentials);
      },
      signOut: async () => {
        await signOutMutation.mutateAsync();
      },
    }),
    [
      currentUserQuery.data,
      currentUserQuery.isPending,
      signInMutation,
      signUpMutation,
      signOutMutation,
    ],
  );
}
