'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { crystallize } from '@/lib/animations';

export type LoadingButtonVariant = 'primary' | 'success' | 'danger';

interface LoadingButtonProps {
  children: ReactNode;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Visual color variant */
  variant?: LoadingButtonVariant;
  /** Click handler */
  onClick?: () => void;
  /** Whether the button is disabled (independent of loading) */
  disabled?: boolean;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Additional CSS classes */
  className?: string;
}

const variantStyles: Record<LoadingButtonVariant, string> = {
  primary: 'bg-frost-cyan/20 border-frost-cyan text-frost-cyan hover:bg-frost-cyan/30',
  success: 'bg-status-safe/20 border-status-safe text-status-safe hover:bg-status-safe/30',
  danger: 'bg-status-breach/20 border-status-breach text-status-breach hover:bg-status-breach/30',
};

const variantDisabledStyles: Record<LoadingButtonVariant, string> = {
  primary: 'bg-frost-cyan/10 border-frost-cyan/30 text-frost-cyan/50',
  success: 'bg-status-safe/10 border-status-safe/30 text-status-safe/50',
  danger: 'bg-status-breach/10 border-status-breach/30 text-status-breach/50',
};

/**
 * Button with frost-crystallization loading animation.
 * Disabled while isLoading. Color variants: primary (frost-cyan),
 * success (mint-green), danger (breach-red). 44px min touch target.
 */
export function LoadingButton({
  children,
  isLoading = false,
  variant = 'primary',
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: LoadingButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'relative inline-flex items-center justify-center gap-2 rounded-lg border px-6 py-3',
        'font-medium text-sm transition-colors duration-200',
        'min-h-11 min-w-11', // 44px touch target
        isDisabled ? variantDisabledStyles[variant] : variantStyles[variant],
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
      animate={isLoading ? crystallize.animate : undefined}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 flex-shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      <span className={isLoading ? 'opacity-80' : ''}>{children}</span>
    </motion.button>
  );
}

export default LoadingButton;
