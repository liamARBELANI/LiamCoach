import { cn } from '@/lib/utils';

/**
 * Wraps a directional icon (chevron/arrow) so it mirrors correctly under RTL.
 * Icons authored pointing left will visually point right, and vice-versa.
 * Use for any icon whose direction carries meaning (next/back).
 */
export function RtlIcon({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn('inline-flex -scale-x-100', className)}>{children}</span>;
}
