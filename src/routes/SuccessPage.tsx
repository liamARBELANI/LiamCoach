import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = [
  '#f97316', '#fb923c', '#fdba74', // orange shades
  '#fbbf24', '#fcd34d',            // amber
  '#34d399', '#6ee7b7',            // green
  '#60a5fa', '#93c5fd',            // blue
  '#f472b6', '#f9a8d4',            // pink
];

function ConfettiPiece({ delay, color, left, size }: { delay: number; color: string; left: number; size: number }) {
  return (
    <motion.div
      style={{
        position: 'fixed',
        top: -20,
        left: `${left}%`,
        width: size,
        height: size * 0.4,
        backgroundColor: color,
        borderRadius: 2,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: '110vh',
        rotate: [0, 180, 360, 540, 720],
        x: [0, 30, -20, 40, -30, 10],
        opacity: [1, 1, 1, 0.8, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        delay,
        ease: 'linear',
        repeat: Infinity,
        repeatDelay: Math.random() * 4,
      }}
    />
  );
}

export default function SuccessPage() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      delay: Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      left: Math.random() * 100,
      size: 8 + Math.random() * 12,
    }))
  );

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="intake-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {/* Confetti */}
      {show && pieces.map((p) => <ConfettiPiece key={p.id} {...p} />)}

      {/* Checkmark circle */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-primary/10">
          {/* Glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="26" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeOpacity="0.3" />
            <motion.path
              d="M16 28.5L23.5 36L40 20"
              stroke="hsl(var(--primary))"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
            />
          </svg>
        </div>
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-sm"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          הטופס התקבל בהצלחה
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground">
          🎉 תודה רבה!
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          קיבלנו את כל הפרטים שלך.<br />
          ניצור איתך קשר בהקדם כדי להתחיל את המסע יחד.
        </p>
      </motion.div>

      {/* Bottom decoration */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 h-1 w-24 rounded-full bg-primary/40"
      />
    </main>
  );
}
