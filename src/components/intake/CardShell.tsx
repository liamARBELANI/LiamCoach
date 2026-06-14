import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardShellProps {
  Icon: LucideIcon;
  headline: string;
  subtitle: string;
  children: ReactNode;
}

export function CardShell({ Icon, headline, subtitle, children }: CardShellProps) {
  return (
    <div className="flex flex-col items-center px-4 pb-16 pt-10">
      {/* Floating animated icon */}
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-7"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <Icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Headline */}
      <h1 className="mb-2 text-center text-2xl font-bold leading-tight text-foreground">
        {headline}
      </h1>
      <p className="mb-8 max-w-xs text-center text-sm leading-relaxed text-muted-foreground">
        {subtitle}
      </p>

      {/* Form fields + button */}
      <div className="w-full max-w-md space-y-5">{children}</div>
    </div>
  );
}
