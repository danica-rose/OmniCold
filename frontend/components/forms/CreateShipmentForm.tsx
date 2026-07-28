'use client';

import { useState } from 'react';
import type { InitializeShipmentParams } from '@/lib/types';
import { LoadingButton, showToast } from '@/components/shared';
import { frostThaw } from '@/lib/animations';
import { motion } from 'framer-motion';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateShipmentFormProps {
  connectedAddress: string;
  onSubmit: (params: InitializeShipmentParams) => Promise<void>;
}

// ─── Field error map ──────────────────────────────────────────────────────────

interface FieldErrors {
  minTemp?: string;
  maxTemp?: string;
  bondAmount?: string;
  logisticsProvider?: string;
  oracle?: string;
  usdcToken?: string;
}

// ─── Input field component ────────────────────────────────────────────────────

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'number';
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium uppercase tracking-wider text-frost-gray">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={[
          'rounded-lg border bg-arctic-slate/60 px-4 py-3 text-sm font-mono text-frost-white',
          'placeholder:text-frost-gray/50 outline-none transition-colors duration-200',
          'focus:border-frost-cyan/60 focus:ring-1 focus:ring-frost-cyan/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'min-h-11',
          error
            ? 'border-status-breach/60 focus:border-status-breach focus:ring-status-breach/20'
            : 'border-frost-cyan/20',
        ].join(' ')}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
      />
      {helperText && !error && (
        <p id={`${id}-helper`} className="text-xs text-frost-gray/70">
          {helperText}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-status-breach font-medium">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateForm(
  minTemp: string,
  maxTemp: string,
  bondAmount: string,
  logisticsProvider: string,
  oracle: string,
  usdcToken: string,
  connectedAddress: string
): FieldErrors {
  const errors: FieldErrors = {};

  const min = parseInt(minTemp, 10);
  const max = parseInt(maxTemp, 10);

  if (minTemp === '' || isNaN(min)) {
    errors.minTemp = 'Min temperature is required';
  }
  if (maxTemp === '' || isNaN(max)) {
    errors.maxTemp = 'Max temperature is required';
  }
  if (!isNaN(min) && !isNaN(max) && min >= max) {
    errors.minTemp = 'Min must be less than Max';
    errors.maxTemp = 'Min must be less than Max';
  }

  const bond = parseFloat(bondAmount);
  if (bondAmount === '' || isNaN(bond) || bond <= 0 || !Number.isInteger(bond)) {
    errors.bondAmount = 'Bond amount must be positive';
  }

  if (!logisticsProvider.trim()) {
    errors.logisticsProvider = 'Logistics Provider address is required';
  } else if (logisticsProvider.trim() === connectedAddress) {
    errors.logisticsProvider = 'Addresses must be distinct from your wallet';
  }

  if (!oracle.trim()) {
    errors.oracle = 'Oracle address is required';
  } else if (oracle.trim() === connectedAddress) {
    errors.oracle = 'Addresses must be distinct from your wallet';
  }

  if (!usdcToken.trim()) {
    errors.usdcToken = 'USDC token address is required';
  }

  return errors;
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CreateShipmentForm — form for Shippers to initialize a new on-chain shipment.
 *
 * Fields: minTemp, maxTemp, logisticsProvider, oracle, usdcToken, bondAmount.
 * Client-side validation runs before submission.
 * Shows a LoadingButton spinner while the TX is pending.
 * Errors are surfaced as inline field messages; contract errors go to toast.
 */
export function CreateShipmentForm({ connectedAddress, onSubmit }: CreateShipmentFormProps) {
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [logisticsProvider, setLogisticsProvider] = useState('');
  const [oracle, setOracle] = useState('');
  const [usdcToken, setUsdcToken] = useState('');
  const [bondAmount, setBondAmount] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = isSubmitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const fieldErrors = validateForm(
      minTemp,
      maxTemp,
      bondAmount,
      logisticsProvider,
      oracle,
      usdcToken,
      connectedAddress
    );

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const params: InitializeShipmentParams = {
        shipper: connectedAddress,
        usdcToken: usdcToken.trim(),
        minTemp: parseInt(minTemp, 10),
        maxTemp: parseInt(maxTemp, 10),
        logisticsProvider: logisticsProvider.trim(),
        oracle: oracle.trim(),
        bondAmount: BigInt(bondAmount),
      };

      await onSubmit(params);
      showToast('success', 'Shipment initialized successfully.');

      // Reset form on success
      setMinTemp('');
      setMaxTemp('');
      setLogisticsProvider('');
      setOracle('');
      setUsdcToken('');
      setBondAmount('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize shipment';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5"
      initial={frostThaw.initial}
      animate={frostThaw.animate}
      noValidate
      aria-label="Create new shipment"
    >
      {/* Temperature row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="minTemp"
          label="Min Temp (centidegrees)"
          type="number"
          value={minTemp}
          onChange={setMinTemp}
          error={errors.minTemp}
          placeholder="e.g. 200"
          disabled={disabled}
        />
        <FormField
          id="maxTemp"
          label="Max Temp (centidegrees)"
          type="number"
          value={maxTemp}
          onChange={setMaxTemp}
          error={errors.maxTemp}
          placeholder="e.g. 800"
          disabled={disabled}
        />
      </div>

      {/* Address fields */}
      <FormField
        id="logisticsProvider"
        label="Logistics Provider Address"
        value={logisticsProvider}
        onChange={setLogisticsProvider}
        error={errors.logisticsProvider}
        placeholder="G…"
        disabled={disabled}
      />
      <FormField
        id="oracle"
        label="Oracle Address"
        value={oracle}
        onChange={setOracle}
        error={errors.oracle}
        placeholder="G…"
        disabled={disabled}
      />
      <FormField
        id="usdcToken"
        label="USDC Token Address"
        value={usdcToken}
        onChange={setUsdcToken}
        error={errors.usdcToken}
        placeholder="C…"
        disabled={disabled}
      />

      {/* Bond amount */}
      <FormField
        id="bondAmount"
        label="Bond Amount (USDC stroops)"
        type="number"
        value={bondAmount}
        onChange={setBondAmount}
        error={errors.bondAmount}
        placeholder="e.g. 1000000000"
        disabled={disabled}
      />

      {/* Submit */}
      <LoadingButton
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={disabled}
        className="w-full sm:w-auto self-end"
      >
        Initialize Shipment
      </LoadingButton>
    </motion.form>
  );
}

export default CreateShipmentForm;
