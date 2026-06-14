import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-12 w-full rounded-xl border border-input bg-background/80 px-3.5 py-2 text-base',
        'placeholder:text-muted-foreground/60',
        'transition-all duration-200',
        'hover:border-primary/30 hover:bg-background',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:border-primary/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-destructive aria-[invalid=true]:bg-destructive/5',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export { Input };
