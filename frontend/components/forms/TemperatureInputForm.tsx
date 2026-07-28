'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LoadingButton, showToast } from '@/components/shared';
import { centidegreesToDisplay } from '@/lib/utils';
import { frostThaw } from '@/lib/animations';
import { PauseIcon } from '@/components/icons';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TemperatureInputFormProps {
  /** Called with the centidegree integer value on submit */
  onSubmit: (temperature: number) => Promise<void>;
  /** Form is only functional while the shipment is active */
  isActive: boolean;
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * TemperatureInputForm — form for Oracle operators to report temperature readings.
 *
 * Shows a real-time °C preview below the input.
 * Disables the entire form when the shipment is not Active.
 * Loading state is managed internally; errors go to toast.
 */
export function TemperatureInputForm({ onSubmit, isActive }: TemperatureInputFormProps) {
  const [rawValue, setRawValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const parsedCentidegrees = rawValue !== '' ? parseInt(rawValue, 10) : null;
  const isValidNumber = parsedCentidegrees !== null && !isNaN(parsedCentidegrees);
  const displayPreview = isValidNumber ? centidegreesToDisplay(parsedCentidegrees) : null;

  const formDisabled = !isActive || isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isActive) return;

    if (rawValue === '' || !isValidNumber) {
      setFieldError('Please enter a valid temperature');
      return;
    }

    setFieldError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(parsedCentidegrees!);
      showToast('success', `Temperature ${displayPreview}°C reported successfully.`);
      setRawValue('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to report temperature';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      initial={frostThaw.initial}
      animate={frostThaw.animate}
      noValidate
      aria-label="Report temperature"
    >
      {/* Not-active notice */}
      {!isActive && (
        <div
          className="flex items-center gap-2 rounded-lg border border-frost-gray/20 bg-arctic-slate/40 px-4 py-3"
          role="status"
          aria-live="polite"
        >
          <span className="text-frost-gray/70" aria-hidden="true"><PauseIcon size={20} className="text-frost-gray/70" /></span>
          <p className="text-sm text-frost-gray">
            Shipment not active — temperature reporting disabled
          </p>
        </div>
      )}

      {/* Temperature input */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="temperature"
          className="text-xs font-medium uppercase tracking-wider text-frost-gray"
        >
          Temperature (centidegrees)
        </label>
        <input
          id="temperature"
          type="number"
          value={rawValue}
          onChange={(e) => {
            setRawValue(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          disabled={formDisabled}
          placeholder="e.g. 250"
          className={[
            'rounded-lg border bg-arctic-slate/60 px-4 py-3 text-sm font-mono text-frost-white',
            'placeholder:text-frost-gray/50 outline-none transition-colors duration-200',
            'focus:border-frost-cyan/60 focus:ring-1 focus:ring-frost-cyan/30',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-11',
            fieldError
              ? 'border-status-breach/60 focus:border-status-breach focus:ring-status-breach/20'
              : 'border-frost-cyan/20',
          ].join(' ')}
          aria-invalid={!!fieldError}
          aria-describedby={fieldError ? 'temp-error' : 'temp-helper'}
        />

        {/* Helper / preview */}
        <div className="flex items-center justify-between gap-2">
          <p id="temp-helper" className="text-xs text-frost-gray/70">
            e.g., 250 = 2.5°C, -150 = -1.5°C
          </p>
          {displayPreview !== null && (
            <p
              className="text-xs font-mono font-semibold text-frost-cyan"
              aria-live="polite"
              aria-atomic="true"
            >
              = {displayPreview}°C
            </p>
          )}
        </div>

        {fieldError && (
          <p id="temp-error" role="alert" className="text-xs text-status-breach font-medium">
            {fieldError}
          </p>
        )}
      </div>

      {/* Submit */}
      <LoadingButton
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={formDisabled}
        className="w-full"
      >
        Report Temperature
      </LoadingButton>
    </motion.form>
  );
}

export default TemperatureInputForm;
