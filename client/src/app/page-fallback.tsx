import { Spinner } from '@/components/ui/spinner';

export function PageFallback() {
  return (
    <main className="grid min-h-svh place-items-center text-sm text-muted-foreground">
      <Spinner aria-label="Loading page" />
    </main>
  );
}
