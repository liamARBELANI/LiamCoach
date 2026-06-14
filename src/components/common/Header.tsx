import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({ title = 'LIAM COACH', subtitle, actions, className }: HeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur',
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="border-s-2 border-primary ps-3 leading-tight">
          <p className="text-sm font-semibold tracking-[0.18em]">{title}</p>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
