'use client';

import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { NETWORK_CONFIG } from '@/lib/constants';
import { formatElapsedTime } from '@/lib/utils';
import { SnowflakeIcon, CoinsIcon, SensorIcon, CheckCircleIcon, ZapIcon, ClipboardIcon, LinkExternalIcon } from '@/components/icons';
import type { IconProps } from '@/components/icons';
import type { TransactionEntry, StellarNetwork } from '@/lib/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TransactionHistoryProps {
  transactions: TransactionEntry[];
  network: StellarNetwork;
}

// ─── Operation metadata ───────────────────────────────────────────────────────

interface OperationMeta {
  Icon: React.ComponentType<IconProps>;
  label: string;
  iconClass: string;
}

const OPERATION_META: Record<TransactionEntry['type'], OperationMeta> = {
  initialize:          { Icon: SnowflakeIcon,    label: 'Initialize',         iconClass: 'text-frost-cyan'    },
  deposit_bond:        { Icon: CoinsIcon,        label: 'Deposit Bond',       iconClass: 'text-status-warning' },
  report_temperature:  { Icon: SensorIcon,       label: 'Report Temperature', iconClass: 'text-frost-cyan'    },
  confirm_delivery:    { Icon: CheckCircleIcon,  label: 'Confirm Delivery',   iconClass: 'text-status-safe'   },
  breach_slash:        { Icon: ZapIcon,          label: 'Breach Slash',       iconClass: 'text-status-breach' },
};

// ─── Status badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: 'success' | 'failure';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const isSuccess = status === 'success';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
      style={{
        backgroundColor: isSuccess ? 'rgba(46,196,182,0.15)' : 'rgba(230,57,70,0.15)',
        color:           isSuccess ? '#2EC4B6'               : '#E63946',
        border:          `1px solid ${isSuccess ? 'rgba(46,196,182,0.4)' : 'rgba(230,57,70,0.4)'}`,
      }}
      aria-label={`Transaction ${status}`}
    >
      {isSuccess ? 'Success' : 'Failed'}
    </span>
  );
}

// ─── Single transaction row ───────────────────────────────────────────────────

interface TransactionRowProps {
  entry: TransactionEntry;
  explorerUrl: string;
  index: number;
  shouldAnimate: boolean;
}

function TransactionRow({ entry, explorerUrl, index, shouldAnimate }: TransactionRowProps) {
  const isSuccess = entry.status === 'success';
  const meta = OPERATION_META[entry.type];

  const explorerLink = `${explorerUrl}/tx/${entry.txHash}`;

  return (
    <motion.a
      href={explorerLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan/60 min-h-[44px]"
      style={{
        borderLeft: `3px solid ${isSuccess ? '#2EC4B6' : '#E63946'}`,
      }}
      initial={shouldAnimate ? { opacity: 0, x: -8 } : false}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay: index * 0.04 }}
      aria-label={`${meta.label} transaction — ${entry.status}, ${formatElapsedTime(entry.timestamp)} ago. Click to view on Stellar Explorer.`}
    >
      {/* Operation icon */}
      <div
        className="bg-frost-cyan/10 rounded-full p-1.5 shrink-0"
        aria-hidden="true"
      >
        <meta.Icon size={16} className={meta.iconClass} />
      </div>

      {/* Operation label + invoker address */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-medium text-frost-white truncate group-hover:text-frost-cyan transition-colors">
          {meta.label}
        </span>
        <span
          className="text-xs font-mono text-frost-gray truncate"
          title={entry.invokerAddress}
        >
          {truncateAddress(entry.invokerAddress)}
        </span>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-frost-gray shrink-0 whitespace-nowrap">
        {formatElapsedTime(entry.timestamp)} ago
      </span>

      {/* Status badge */}
      <StatusBadge status={entry.status} />

      {/* External link indicator */}
      <LinkExternalIcon
        size={12}
        className="text-frost-gray opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
        aria-hidden="true"
      />
    </motion.a>
  );
}

// ─── Inline address truncation (no copy button) ───────────────────────────────

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * TransactionHistory — reverse-chronological list of all contract interactions.
 *
 * Each row:
 * - Operation type SVG icon + label
 * - Invoker address (truncated)
 * - Elapsed time since transaction
 * - Success (Mint Green) or Failure (Breach Red) status badge
 * - Green / Red left border by status
 * - Clickable: opens stellar.expert explorer in a new tab
 *
 * Empty state displayed when no transactions exist.
 */
export function TransactionHistory({ transactions, network }: TransactionHistoryProps) {
  const prefersReduced = useReducedMotion();

  const explorerUrl = NETWORK_CONFIG[network].explorerUrl;

  // Sort newest first
  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp),
    [transactions]
  );

  return (
    <section
      aria-label="Transaction history"
      className="flex flex-col gap-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1 border-b border-frost-cyan/10 pb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-frost-gray">
          Transaction History
        </h3>
        {sorted.length > 0 && (
          <span className="text-xs text-frost-gray">
            {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
          </span>
        )}
      </div>

      {/* List or empty state */}
      {sorted.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="flex flex-col gap-1"
          role="list"
          aria-label="Transaction entries"
        >
          {sorted.map((entry, idx) => (
            <div key={entry.id} role="listitem">
              <TransactionRow
                entry={entry}
                explorerUrl={explorerUrl}
                index={idx}
                shouldAnimate={!prefersReduced}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10 rounded-lg border border-dashed border-frost-gray/25"
      aria-live="polite"
    >
      <div className="bg-frost-cyan/10 rounded-full p-3">
        <ClipboardIcon size={28} className="text-frost-gray/40" aria-hidden="true" />
      </div>
      <p className="text-sm text-frost-gray text-center">
        No transactions yet.
        <br />
        <span className="text-xs opacity-70">
          Contract interactions will appear here.
        </span>
      </p>
    </div>
  );
}

export default TransactionHistory;
