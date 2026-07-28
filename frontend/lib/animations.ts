'use client';

import { useReducedMotion } from 'framer-motion';

/** Page transition: frost-wipe (clip-path animation) */
export const frostWipe = {
  initial: { clipPath: 'inset(0 100% 0 0)' },
  animate: { clipPath: 'inset(0 0% 0 0)', transition: { duration: 0.3 } },
  exit: { clipPath: 'inset(0 0 0 100%)', transition: { duration: 0.3 } },
};

/** Content reveal: frost-thaw (blur + fade + scale) */
export const frostThaw = {
  initial: { opacity: 0, filter: 'blur(8px)', scale: 0.98 },
  animate: { opacity: 1, filter: 'blur(0px)', scale: 1, transition: { duration: 0.4 } },
};

/** Toast notification: slide-in from right with spring */
export const toastEnter = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { opacity: 0, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

/** Pipeline frost-spread: path drawing animation */
export const pipelineTransition = {
  initial: { pathLength: 0 },
  animate: { pathLength: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

/** Gauge needle: spring physics animation */
export const gaugeNeedle = {
  animate: (rotation: number) => ({
    rotate: rotation,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  }),
};

/** Button loading: frost crystallization pulse */
export const crystallize = {
  animate: {
    scale: [1, 1.02, 1],
    opacity: [1, 0.8, 1],
    transition: { repeat: Infinity, duration: 1.2 },
  },
};

/** Bond card: thaw (released state) */
export const bondThaw = {
  initial: { borderColor: '#00D4FF' },
  animate: { borderColor: '#2EC4B6', transition: { duration: 0.8 } },
};

/** Bond card: crack (slashed state) */
export const bondCrack = {
  initial: { borderColor: '#00D4FF' },
  animate: { borderColor: '#E63946', transition: { duration: 0.4 } },
};

/** Landing page: frost-fade transition to dashboard */
export const frostFade = {
  initial: { opacity: 1 },
  exit: { opacity: 0, filter: 'blur(12px)', transition: { duration: 0.5 } },
};

/**
 * Hook that returns animation variant or empty object based on reduced-motion preference.
 * Components should use this to disable animations for accessibility.
 */
export function useAnimationVariant<T extends object>(variant: T): T | Record<string, never> {
  const prefersReduced = useReducedMotion();
  return prefersReduced ? {} : variant;
}
