import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Unexpected error';

  useEffect(() => {
    console.error('Route failed:', error);
  }, [error]);

  return (
    <main role="alert" className="grid min-h-svh place-content-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={() => window.location.reload()}>Reload</Button>
    </main>
  );
}
