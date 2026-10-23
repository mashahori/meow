import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import { PageFallback } from './page-fallback';
import { ProtectedLayout } from './protected-layout';
import { RouteError } from './route-error';

const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    hydrateFallbackElement: <PageFallback />,
    children: [
      {
        path: '/login',
        lazy: async () => {
          const { AuthPage } = await import('@/pages/auth-page');
          return { element: <AuthPage mode="login" /> };
        },
      },
      {
        path: '/register',
        lazy: async () => {
          const { AuthPage } = await import('@/pages/auth-page');
          return { element: <AuthPage mode="register" /> };
        },
      },
      {
        path: '/forgot-password',
        lazy: async () => {
          const { PasswordResetPage } = await import('@/pages/password-reset-page');
          return { element: <PasswordResetPage mode="request" /> };
        },
      },
      {
        path: '/reset-password',
        lazy: async () => {
          const { PasswordResetPage } = await import('@/pages/password-reset-page');
          return { element: <PasswordResetPage mode="reset" /> };
        },
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: '/budgets',
            lazy: async () => {
              const { BudgetsPage } = await import('@/pages/budgets-page');
              return { Component: BudgetsPage };
            },
          },
          {
            path: '/budgets/:budgetId/:categoryId',
            lazy: async () => {
              const { CategoryDetailsPage } = await import('@/pages/category-details-page');
              return { Component: CategoryDetailsPage };
            },
          },
          {
            path: '/budgets/:budgetId',
            lazy: async () => {
              const { BudgetDetailsPage } = await import('@/pages/budget-details-page');
              return { Component: BudgetDetailsPage };
            },
          },
        ],
      },
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
