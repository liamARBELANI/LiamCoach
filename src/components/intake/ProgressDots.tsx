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
  // Overall progress across both steps (approx 7 cards per step)
  const CARDS_PER_STEP = 7;
  const globalProgress = Math.round(
    ((step - 1) * CARDS_PER_STEP + cardIdx + 1) / (TOTAL_STEPS * CARDS_PER_STEP) * 100
  );

  return (
    <div className="border-b border-border/40 bg-background/90 px-4 py-3 backdrop-blur-md">
      {/* Top row: back button + step badge + card counter */}
      <div className="flex items-center justify-between mb-2">
        {/* Back — start side (right in RTL) */}
        <div className="w-9">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={onBack}
              aria-label="חזרה"
            >
              {/* In RTL "back" means pointing LEFT visually = ChevronLeft, but ChevronRight renders as ← in RTL doc */}
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Step badge — centered */}
        <div className="flex items-center gap-2">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5"
          >
            <span className="text-xs font-semibold text-primary">שלב {step}</span>
            <span className="text-xs text-muted-foreground">מתוך {TOTAL_STEPS}</span>
          </motion.div>
        </div>

        {/* Card counter — end side (left in RTL) */}
        <div className="w-9 text-start">
          <span className="text-xs font-medium text-muted-foreground">
            {cardIdx + 1}/{totalCards}
          </span>
        </div>
      </div>

      {/* Segmented dots row */}
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={globalProgress} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: totalCards }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-primary"
            animate={{
              width: i === cardIdx ? 24 : 6,
              opacity: i > cardIdx ? 0.15 : i === cardIdx ? 1 : 0.5,
            }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
        ))}

        {/* Faint separator between steps when on step 2 */}
        {step === 2 && (
          <div className="mx-1 h-3 w-px bg-border/60" />
        )}
      </div>
    </div>
  );
}
