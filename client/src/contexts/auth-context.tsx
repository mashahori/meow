import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import { getCurrentUser, login, logout, register, type AuthUser, type Credentials } from '../lib/auth-api'
import { AuthContext, type AuthContextValue } from './auth-context-value'

const currentUserKey = ['auth', 'current-user'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const currentUserQuery = useQuery({
    queryKey: currentUserKey,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 60_000,
  })
  const signInMutation = useMutation({
    mutationFn: (credentials: Credentials) => login(credentials),
    onSuccess: async (user) => {
      await queryClient.cancelQueries({ queryKey: currentUserKey })
      queryClient.setQueryData(currentUserKey, user)
    },
  })
  const signUpMutation = useMutation({
    mutationFn: async (credentials: Credentials): Promise<AuthUser> => {
      await register(credentials)
      return login(credentials)
    },
    onSuccess: async (user) => {
      await queryClient.cancelQueries({ queryKey: currentUserKey })
      queryClient.setQueryData(currentUserKey, user)
    },
  })
  const signOutMutation = useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: currentUserKey })
      queryClient.setQueryData(currentUserKey, null)
    },
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      user: currentUserQuery.data ?? null,
      isLoading: currentUserQuery.isPending,
      signIn: async (credentials) => {
        await signInMutation.mutateAsync(credentials)
      },
      signUp: async (credentials) => {
        await signUpMutation.mutateAsync(credentials)
      },
      signOut: async () => {
        await signOutMutation.mutateAsync()
      },
    }),
    [
      currentUserQuery.data,
      currentUserQuery.isPending,
      signInMutation,
      signUpMutation,
      signOutMutation,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
