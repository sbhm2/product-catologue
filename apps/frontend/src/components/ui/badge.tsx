import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'destructive' | 'outline';

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-secondary text-secondary-foreground',
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  destructive: 'bg-destructive/12 text-destructive',
  outline: 'border border-border text-muted-foreground',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
