import { Button } from '@/components/ui/button';

/**
 * The single primary action, pinned to the bottom of the wizard. It lives
 * OUTSIDE the animated card area so it never moves between cards — the user can
 * keep their thumb in one place. Safe-area padding clears the iPhone home bar.
 */
export interface StepHandle {
  /** Validate the current card and advance / submit. */
  submit: () => void;
}

interface StickyActionBarProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function StickyActionBar({ label, onClick, disabled }: StickyActionBarProps) {
  return (
    <div className="shrink-0 border-t border-border/40 bg-background/80 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur">
      <Button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="mx-auto block h-14 w-full max-w-md rounded-2xl text-lg font-medium shadow-lg shadow-primary/25"
      >
        {label}
      </Button>
    </div>
  );
}
