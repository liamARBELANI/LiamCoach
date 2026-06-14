import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProgressDotsProps {
  step: 1 | 2;
  cardIdx: number;
  totalCards: number;
  onBack?: () => void;
}

export function ProgressDots({ step, cardIdx, totalCards, onBack }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-3 border-b border-border/40 bg-background/95 px-4 py-3 backdrop-blur-sm">
      {/* Back arrow (start side — right in RTL) */}
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
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Animated dots */}
      <div className="flex flex-1 items-center justify-center gap-1.5">
        {Array.from({ length: totalCards }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-primary"
            animate={{
              width: i === cardIdx ? 20 : 6,
              opacity: i > cardIdx ? 0.18 : i === cardIdx ? 1 : 0.45,
            }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* Step label */}
      <div className="w-8 shrink-0 text-end">
        <span className="text-xs font-medium text-muted-foreground">{step}/2</span>
      </div>
    </div>
  );
}
