import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'
import { useAuth } from './hooks/use-auth'
import { AuthPage } from './pages/auth-page'
import { DashboardPage } from './pages/dashboard-page'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function ProtectedDashboard() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <main className="grid min-h-svh place-items-center text-sm text-[#756d8d]">Loading workspace…</main>
  }

  return user ? <DashboardPage /> : <Navigate to="/login" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
