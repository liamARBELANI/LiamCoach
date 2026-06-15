import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CardShellProps {
  Icon: LucideIcon;
  headline: string;
  subtitle: string;
  children: ReactNode;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export function CardShell({ Icon, headline, subtitle, children }: CardShellProps) {
  return (
    <div className="flex flex-col items-center px-4 pb-8 pt-6">
      {/* Icon with glow ring */}
      <motion.div
        style={{ animation: 'float-bob 3s ease-in-out infinite' }}
        className="mb-4"
      >
        <div className="icon-glow flex h-14 w-14 items-center justify-center rounded-2xl">
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-1.5 text-center text-2xl font-bold leading-tight text-foreground"
      >
        {headline}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="mb-6 max-w-xs text-center text-sm leading-relaxed text-muted-foreground"
      >
        {subtitle}
      </motion.p>

      {/* Form fields + button — staggered */}
      <motion.div
        className="w-full max-w-md space-y-5"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Wrap children for stagger — each direct child gets animated */}
        {Array.isArray(children)
          ? children.map((child, i) => (
              <motion.div key={i} variants={itemVariants}>
                {child}
              </motion.div>
            ))
          : <motion.div variants={itemVariants}>{children}</motion.div>
        }
      </motion.div>
    </div>
  );
}
