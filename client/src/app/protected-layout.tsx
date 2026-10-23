import { Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/app-layout';
import { useAuth } from '@/hooks/use-auth';
import { PageFallback } from './page-fallback';

export function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageFallback />;
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}
