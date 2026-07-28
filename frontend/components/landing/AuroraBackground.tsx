'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * AuroraBackground — animated arctic aurora gradient background.
 * Cycles through Frost Cyan (#00D4FF) and Deep Arctic Blue (#1B2A4A)
 * with gentle wave motion using Framer Motion.
 *
 * Respects prefers-reduced-motion: falls back to a static gradient.
 * Position: absolute, fills parent container.
 */
export function AuroraBackground() {
  const prefersReduced = useReducedMotion();

  if (prefersReduced) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,255,0.18) 0%, rgba(27,42,74,0.7) 55%, #0F1923 100%)',
        }}
      />
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* Base deep arctic layer */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, #0F1923 0%, #1B2A4A 100%)' }}
      />

      {/* Aurora wave 1 — primary cyan sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 50% at 50% -10%, rgba(0,212,255,0.22) 0%, transparent 65%)',
        }}
        animate={{
          scaleX: [1, 1.12, 0.95, 1.08, 1],
          scaleY: [1, 0.92, 1.06, 0.97, 1],
          y: [0, -12, 8, -6, 0],
          opacity: [0.85, 1, 0.75, 0.95, 0.85],
        }}
        transition={{
          duration: 12,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        }}
      />

      {/* Aurora wave 2 — secondary offset sweep */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 40% at 30% 20%, rgba(0,212,255,0.14) 0%, rgba(27,42,74,0.3) 50%, transparent 70%)',
        }}
        animate={{
          scaleX: [1, 0.9, 1.1, 0.95, 1],
          scaleY: [1, 1.08, 0.9, 1.05, 1],
          x: [0, 20, -15, 10, 0],
          opacity: [0.7, 0.95, 0.6, 0.85, 0.7],
        }}
        transition={{
          duration: 16,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
          delay: 2,
        }}
      />

      {/* Aurora wave 3 — deep blue accent */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 70% 10%, rgba(27,42,74,0.8) 0%, rgba(0,212,255,0.08) 45%, transparent 70%)',
        }}
        animate={{
          scaleX: [1, 1.05, 0.98, 1.03, 1],
          scaleY: [1, 0.96, 1.04, 0.99, 1],
          x: [0, -10, 8, -5, 0],
          opacity: [0.6, 0.8, 0.55, 0.75, 0.6],
        }}
        transition={{
          duration: 18,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
          delay: 4,
        }}
      />

      {/* Bottom fade to ensure content readability */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background: 'linear-gradient(to top, #0F1923 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

export default AuroraBackground;
