import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  /** Text to display below the spinner */
  message?: string;
  /** Size variant for the loading indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to display as a full-page overlay */
  fullPage?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Loading state component with spinner and optional message.
 * Styled with dark theme for consistent UI.
 * 
 * Requirements: 7.3, 7.4, 7.6
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      {message && (
        <p className={cn('text-muted-foreground', textSizeClasses[size])}>{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

interface LoadingSkeletonProps {
  /** Number of skeleton lines to display */
  lines?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Skeleton loading placeholder for content areas.
 * Provides visual feedback while content is loading.
 */
export function LoadingSkeleton({ lines = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 animate-pulse rounded bg-muted',
            index === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingCardProps {
  /** Title for the loading card */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card-style loading placeholder with skeleton content.
 * Useful for loading states in card-based layouts.
 */
export function LoadingCard({ title, className }: LoadingCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 shadow',
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      )}
      <LoadingSkeleton lines={4} />
    </div>
  );
}

export default LoadingState;
