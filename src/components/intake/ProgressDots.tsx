import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgressDotsProps {
  step: 1 | 2;
  cardIdx: number;
  totalCards: number;
  onBack?: () => void;
}

const TOTAL_STEPS = 2;

export function ProgressDots({ step, cardIdx, totalCards, onBack }: ProgressDotsProps) {
  // Fraction of the *current* step the trainee has completed (0..1).
  const withinStep = totalCards > 0 ? (cardIdx + 1) / totalCards : 0;
  // Each of the two segments fills independently: a finished step is full,
  // the active step grows with the cards, an upcoming step is empty.
  const fillFor = (s: 1 | 2) => (step > s ? 1 : step === s ? withinStep : 0);
  const globalProgress = Math.round(((step - 1 + withinStep) / TOTAL_STEPS) * 100);

  return (
    <div className="border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Back — start side (right in RTL) */}
        <div className="w-8 shrink-0">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onBack}
              aria-label="חזרה"
            >
              {/* ChevronRight renders as ← in the RTL document = "back" */}
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Two clean segments — one per step. No card counter, no per-card dots. */}
        <div
          className="flex flex-1 items-center gap-2"
          role="progressbar"
          aria-valuenow={globalProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`שלב ${step} מתוך ${TOTAL_STEPS}`}
        >
          {([1, 2] as const).map((s) => (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-primary/10">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={false}
                animate={{ width: `${fillFor(s) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          ))}
        </div>

        {/* Spacer mirroring the back button so the bar stays centered. */}
        <div className="w-8 shrink-0" aria-hidden />
      </div>
    </div>
  );
}
