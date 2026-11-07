import type { ReactNode } from 'react';
import { useAuthSession } from '../hooks/use-auth-session';
import { AuthContext } from './auth-context-value';

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useAuthSession();

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
