'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { toastEnter } from '@/lib/animations';
import { TOAST_DURATION_SUCCESS_MS, TOAST_DURATION_ERROR_MS } from '@/lib/constants';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-status-safe bg-status-safe/10 text-status-safe',
  error: 'border-status-breach bg-status-breach/10 text-status-breach',
  warning: 'border-status-warning bg-status-warning/10 text-status-warning',
};

const toastIcons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    // Auto-dismiss for success toasts (4s) and error toasts (5s)
    // Warning toasts are persistent (no auto-dismiss)
    if (toast.type === 'success') {
      const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_SUCCESS_MS);
      return () => clearTimeout(timer);
    }
    if (toast.type === 'error') {
      const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_ERROR_MS);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.type, onDismiss]);

  return (
    <motion.div
      layout
      variants={toastEnter}
      initial="initial"
      animate="animate"
      exit="exit"
      className={[
        'flex items-center gap-3 rounded-lg border px-4 py-3',
        'backdrop-blur-md shadow-frost-glow min-w-[300px] max-w-[420px]',
        toastStyles[toast.type],
      ].join(' ')}
      role="alert"
      aria-live="polite"
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">
        {toastIcons[toast.type]}
      </span>
      <p className="flex-1 text-sm text-frost-white">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-frost-white/10 transition-colors min-h-11 min-w-11 flex items-center justify-center"
        aria-label="Dismiss notification"
      >
        <span aria-hidden="true">×</span>
      </button>
    </motion.div>
  );
}

/**
 * Toast notification container. Renders toasts in top-right corner with
 * slide-in animation. Three types: success (auto 4s), error (5s persistent),
 * warning (persistent).
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    return id;
  }, []);

  // Expose addToast globally via custom event
  useEffect(() => {
    const handler = (e: CustomEvent<{ type: ToastType; message: string }>) => {
      addToast(e.detail.type, e.detail.message);
    };
    window.addEventListener('omnicold:toast' as string, handler as EventListener);
    return () => window.removeEventListener('omnicold:toast' as string, handler as EventListener);
  }, [addToast]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Utility to dispatch a toast from anywhere in the app.
 * Uses a custom DOM event that the ToastContainer listens to.
 */
export function showToast(type: ToastType, message: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('omnicold:toast', { detail: { type, message } })
    );
  }
}

export default ToastContainer;
