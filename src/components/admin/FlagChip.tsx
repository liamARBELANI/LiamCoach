import { cn } from '@/lib/utils';
import type { Flag, FlagSeverity, BmiCategory } from '@/lib/insights';

const SEVERITY_CLASS: Record<FlagSeverity, string> = {
  high: 'bg-red-500/15 text-red-700 dark:text-red-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
};

const chipBase = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap';

/** A single quiet, colored alert chip. */
export function FlagChip({ flag, className }: { flag: Flag; className?: string }) {
  return <span className={cn(chipBase, SEVERITY_CLASS[flag.severity], className)}>{flag.label}</span>;
}

const BMI_CLASS: Record<BmiCategory, string> = {
  'תת-משקל': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'תקין': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'עודף': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'השמנה': 'bg-red-500/15 text-red-700 dark:text-red-400',
};

/** BMI value + category, color-coded. */
export function BmiChip({ value, category, className }: { value: number; category: BmiCategory; className?: string }) {
  return (
    <span className={cn(chipBase, BMI_CLASS[category], className)} dir="ltr">
      BMI {value} · {category}
    </span>
  );
}
