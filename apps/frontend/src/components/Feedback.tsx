import { AlertTriangle, Loader2, PackageOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LoadingState({ label = 'Loading products…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 aria-hidden="true" className="size-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-start gap-3 rounded-3xl border border-destructive/25 bg-destructive/5 p-6', className)}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle aria-hidden="true" className="size-4" />
        {title}
      </span>
      <p className="max-w-lg text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, message, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center', className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageOpen aria-hidden="true" className="size-6" />
      </span>
      <h2 className="text-xl">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
