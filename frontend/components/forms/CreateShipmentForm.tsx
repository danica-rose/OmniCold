'use client';

import { useState, useEffect } from 'react';
import type { InitializeShipmentParams } from '@/lib/types';
import { LoadingButton, showToast } from '@/components/shared';
import { frostThaw } from '@/lib/animations';
import { motion } from 'framer-motion';
import { fetchPrices, type PriceData } from '@/services/prices';

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
  if (bondAmount === '' || isNaN(bond) || bond <= 0) {
    errors.bondAmount = 'Bond amount must be greater than 0';
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
// Default USDC token address for demo mode (testnet)
const DEFAULT_USDC_TOKEN = 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA';

export function CreateShipmentForm({ connectedAddress, onSubmit }: CreateShipmentFormProps) {
  const [minTemp, setMinTemp] = useState('');
  const [maxTemp, setMaxTemp] = useState('');
  const [logisticsProvider, setLogisticsProvider] = useState('');
  const [oracle, setOracle] = useState('');
  const [usdcToken, setUsdcToken] = useState(DEFAULT_USDC_TOKEN);
  const [bondAmount, setBondAmount] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prices, setPrices] = useState<PriceData | null>(null);

  const disabled = isSubmitting;

  // Fetch prices on mount for live conversion
  useEffect(() => {
    fetchPrices().then(setPrices).catch(() => {});
  }, []);

  // Compute bond conversion preview (input is now in USDC, not stroops)
  const bondPreview = (() => {
    if (!bondAmount || !prices) return null;
    const usdcValue = parseFloat(bondAmount);
    if (isNaN(usdcValue) || usdcValue <= 0) return null;
    const xlmValue = usdcValue / prices.xlmUsd;
    const stroops = Math.round(usdcValue * 10_000_000);
    return { usdc: usdcValue.toFixed(2), xlm: xlmValue.toFixed(2), stroops: stroops.toLocaleString() };
  })();

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
      // Convert USDC to stroops (1 USDC = 10,000,000 stroops)
      const usdcValue = parseFloat(bondAmount);
      const stroops = BigInt(Math.round(usdcValue * 10_000_000));

      const params: InitializeShipmentParams = {
        shipper: connectedAddress,
        usdcToken: usdcToken.trim(),
        minTemp: parseInt(minTemp, 10),
        maxTemp: parseInt(maxTemp, 10),
        logisticsProvider: logisticsProvider.trim(),
        oracle: oracle.trim(),
        bondAmount: stroops,
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
        placeholder="G… (wallet that will deposit the bond)"
        disabled={disabled}
        helperText="The wallet address that will deposit the bond. Must be different from yours."
      />
      <FormField
        id="oracle"
        label="Oracle Address"
        value={oracle}
        onChange={setOracle}
        error={errors.oracle}
        placeholder="G… (wallet that reports temperatures)"
        disabled={disabled}
        helperText="The wallet address authorized to report IoT temperature readings."
      />
      <FormField
        id="usdcToken"
        label="USDC Token Address (Demo)"
        value={usdcToken}
        onChange={setUsdcToken}
        error={errors.usdcToken}
        placeholder="C…"
        disabled={disabled}
        helperText="Pre-filled for demo. No real USDC needed."
      />

      {/* Bond amount — now in USDC */}
      <FormField
        id="bondAmount"
        label="Bond Amount (USDC)"
        type="number"
        value={bondAmount}
        onChange={setBondAmount}
        error={errors.bondAmount}
        placeholder="e.g. 10"
        disabled={disabled}
        helperText="Enter amount in USDC (e.g. 10 = 10 USDC)"
      />

      {/* Bond conversion preview */}
      {bondPreview && (
        <div className="flex items-center gap-3 -mt-2 px-1">
          <span className="text-xs text-frost-cyan font-mono font-semibold">
            ≈ {bondPreview.xlm} XLM
          </span>
          <span className="text-xs text-frost-gray/40">•</span>
          <span className="text-xs text-frost-gray font-mono">
            {bondPreview.stroops} stroops
          </span>
        </div>
      )}

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
