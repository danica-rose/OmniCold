'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export type FrostCardVariant = 'default' | 'success' | 'warning' | 'error';

interface FrostCardProps {
  children: ReactNode;
  variant?: FrostCardVariant;
  className?: string;
  /** Framer Motion layoutId for shared layout animations across views */
  layoutId?: string;
}

const variantBorderColors: Record<FrostCardVariant, string> = {
  default: 'border-frost-cyan/20',
  success: 'border-status-safe/40',
  warning: 'border-status-warning/40',
  error: 'border-status-breach/40',
};

const variantHoverShadows: Record<FrostCardVariant, string> = {
  default: 'hover:shadow-frost-hover',
  success: 'hover:shadow-[0_0_30px_rgba(46,196,182,0.15)]',
  warning: 'hover:shadow-[0_0_30px_rgba(255,159,28,0.15)]',
  error: 'hover:shadow-[0_0_30px_rgba(230,57,70,0.15)]',
};

/**
 * Frosted-glass card wrapper with backdrop-blur, arctic-slate background,
 * gradient border, and frost-glow on hover.
 * Supports variant prop for status-colored borders.
 */
export function FrostCard({ children, variant = 'default', className = '', layoutId }: FrostCardProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={[
        'relative rounded-xl border backdrop-blur-md',
        'bg-arctic-slate/80 bg-frost-gradient',
        'shadow-frost-glow transition-all duration-300',
        variantBorderColors[variant],
        variantHoverShadows[variant],
        className,
      ].join(' ')}
      style={{
        boxShadow: 'inset 0 1px 0 rgba(0, 212, 255, 0.06), 0 4px 24px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 212, 255, 0.08)',
      }}
      whileHover={{ scale: 1.005, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top highlight line */}
      <div
        className="absolute top-0 left-4 right-4 h-px rounded-full"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2), transparent)' }}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}

export default FrostCard;
