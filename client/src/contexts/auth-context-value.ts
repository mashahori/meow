import { createContext } from 'react'
import type { AuthUser, Credentials } from '../lib/auth-api'

export type AuthContextValue = {
  user: AuthUser | null
  isLoading: boolean
  signIn: (credentials: Credentials) => Promise<void>
  signUp: (credentials: Credentials) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
