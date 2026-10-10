import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'
import { useAuth } from './hooks/use-auth'
import { AppLayout } from './components/app-layout'
import { Spinner } from './components/ui/spinner'
import { AuthPage } from './pages/auth-page'
import { BudgetsPage } from './pages/budgets-page'
import { DashboardPage } from './pages/dashboard-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function ProtectedLayout() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <main className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        <Spinner aria-label="Loading workspace" />
      </main>
    )
  }

  return user ? <AppLayout /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route element={<ProtectedLayout />}>
              {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
              <Route path="/budgets" element={<BudgetsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
