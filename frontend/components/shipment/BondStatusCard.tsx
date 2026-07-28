'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { FrostCard } from '@/components/shared/FrostCard';
import { TruncatedAddress } from '@/components/shared/TruncatedAddress';
import { formatUsdcAmount, formatElapsedTime } from '@/lib/utils';
import { bondThaw, bondCrack } from '@/lib/animations';
import { LockIcon, UnlockIcon, SlashIcon } from '@/components/icons';
import type { IconProps } from '@/components/icons';
import type { BondStatus } from '@/lib/types';
import { usePrices } from '@/hooks/usePrices';
import { convertUsdcAmount } from '@/services/prices';

// ─── Props ────────────────────────────────────────────────────────────────────

interface BondStatusCardProps {
  /** USDC amount in stroops (i128) */
  amount: bigint;
  /** Current bond lifecycle state */
  status: BondStatus;
  /** Contract address holding the escrow */
  contractAddress: string;
  /** Recipient address (provider on release, shipper on slash) */
  recipientAddress?: string;
  /** Unix-ms timestamp of the most recent bond state change */
  lastChangeTimestamp?: number;
}

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  Icon: React.ComponentType<IconProps>;
  borderColor: string;
  textColor: string;
  glowColor: string;
  frostCardVariant: 'default' | 'success' | 'error';
}

const STATUS_CONFIG: Record<BondStatus, StatusConfig> = {
  held: {
    label: 'Bond Held in Escrow',
    Icon: LockIcon,
    borderColor: '#00D4FF',
    textColor: '#00D4FF',
    glowColor: 'rgba(0,212,255,0.25)',
    frostCardVariant: 'default',
  },
  released: {
    label: 'Bond Released to Provider',
    Icon: UnlockIcon,
    borderColor: '#2EC4B6',
    textColor: '#2EC4B6',
    glowColor: 'rgba(46,196,182,0.25)',
    frostCardVariant: 'success',
  },
  slashed: {
    label: 'Bond Slashed to Shipper',
    Icon: SlashIcon,
    borderColor: '#E63946',
    textColor: '#E63946',
    glowColor: 'rgba(230,57,70,0.25)',
    frostCardVariant: 'error',
  },
};

// ─── Shimmer animation (held state background) ────────────────────────────────

const shimmerVariant = {
  animate: {
    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * BondStatusCard — displays the escrowed USDC bond with state-reactive visuals.
 *
 * Visual states:
 * - Held:     Frost Cyan border + subtle frost-crystal shimmer background animation
 * - Released: Mint Green border + bondThaw animation + unlock icon
 * - Slashed:  Breach Red border + bondCrack animation + slash icon
 *
 * Content:
 * - Large USDC amount (2 decimal places)
 * - Status label with icon
 * - Contract address with copy button (labeled "Contract")
 * - Optional recipient address (labeled "Recipient")
 * - Last change timestamp (labeled "Updated", shown as elapsed time)
 */
export function BondStatusCard({
  amount,
  status,
  contractAddress,
  recipientAddress,
  lastChangeTimestamp,
}: BondStatusCardProps) {
  const prefersReduced = useReducedMotion();
  const config = STATUS_CONFIG[status];

  // Pick the border transition animation for released/slashed states
  const borderAnimation =
    status === 'released' ? bondThaw
    : status === 'slashed' ? bondCrack
    : null;

  return (
    <FrostCard variant={config.frostCardVariant} className="overflow-hidden" layoutId="bond-status-card">
      {/* ── Border animation overlay (released / slashed) ─────────────────── */}
      {borderAnimation && !prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: '2px solid' }}
          initial={borderAnimation.initial}
          animate={borderAnimation.animate}
        />
      )}

      {/* ── Held state: frost-crystal shimmer background ──────────────────── */}
      {status === 'held' && !prefersReduced && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              'linear-gradient(120deg, transparent 20%, rgba(0,212,255,0.06) 50%, transparent 80%)',
            backgroundSize: '200% 200%',
          }}
          variants={shimmerVariant}
          animate="animate"
          aria-hidden="true"
        />
      )}

      {/* ── Card content ──────────────────────────────────────────────────── */}
      <div className="relative z-10 p-6 flex flex-col gap-5">

        {/* USDC amount — large display */}
        <div className="flex flex-col items-center gap-1">
          <motion.span
            className="text-5xl font-bold tabular-nums"
            style={{ color: config.textColor }}
            key={`amount-${status}`}
            initial={prefersReduced ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            aria-label={`${formatUsdcAmount(amount)} USDC`}
          >
            {formatUsdcAmount(amount)}
          </motion.span>
          <span className="text-sm font-semibold tracking-widest uppercase text-frost-gray">
            USDC
          </span>
          <CurrencyEquivalents amount={amount} />
        </div>

        {/* Status label with icon */}
        <motion.div
          className="flex items-center justify-center gap-2"
          key={`status-${status}`}
          initial={prefersReduced ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
        >
          <div
            className="rounded-full p-1.5"
            style={{ backgroundColor: `${config.borderColor}20` }}
          >
            <config.Icon
              size={18}
              className="shrink-0"
              style={{ color: config.textColor, filter: status === 'held' ? 'drop-shadow(0 0 4px #00D4FF)' : undefined }}
              aria-hidden="true"
            />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: config.textColor }}
          >
            {config.label}
          </span>
        </motion.div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}40, transparent)` }}
          aria-hidden="true"
        />

        {/* Address rows */}
        <div className="flex flex-col gap-3">
          {/* Contract address */}
          <AddressRow
            label="Contract"
            address={contractAddress}
            labelColor={config.textColor}
          />

          {/* Optional recipient address */}
          {recipientAddress && (
            <AddressRow
              label="Recipient"
              address={recipientAddress}
              labelColor={config.textColor}
            />
          )}

          {/* Last change timestamp */}
          {lastChangeTimestamp != null && (
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-xs font-medium uppercase tracking-wider"
                style={{ color: config.textColor, opacity: 0.7 }}
              >
                Updated
              </span>
              <span className="text-xs font-mono text-frost-gray">
                {formatElapsedTime(lastChangeTimestamp)} ago
              </span>
            </div>
          )}
        </div>
      </div>
    </FrostCard>
  );
}

// ─── Address row sub-component ────────────────────────────────────────────────

interface AddressRowProps {
  label: string;
  address: string;
  labelColor: string;
}

function AddressRow({ label, address, labelColor }: AddressRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <span
        className="text-xs font-medium uppercase tracking-wider shrink-0"
        style={{ color: labelColor, opacity: 0.7 }}
      >
        {label}
      </span>
      <TruncatedAddress address={address} className="min-w-0" />
    </div>
  );
}

// ─── Currency equivalents sub-component ───────────────────────────────────────

function CurrencyEquivalents({ amount }: { amount: bigint }) {
  const { prices } = usePrices();
  const converted = convertUsdcAmount(amount, prices);
  return (
    <div className="flex items-center justify-center gap-3 text-xs text-frost-gray">
      <span>≈ {converted.xlm} XLM</span>
      <span className="text-frost-gray/30">|</span>
      <span>≈ ₱{converted.php} PHP</span>
    </div>
  );
}

export default BondStatusCard;
