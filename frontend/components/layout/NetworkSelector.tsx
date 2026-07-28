'use client';

import { useState } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { useContractStore } from '@/stores/contractStore';
import type { StellarNetwork } from '@/lib/types';

const NETWORK_LABELS: Record<StellarNetwork, string> = {
  testnet: 'Testnet',
  mainnet: 'Mainnet',
};

/** Color indicator per network */
const NETWORK_INDICATOR: Record<StellarNetwork, string> = {
  testnet: 'bg-frost-cyan',      // Frost Cyan
  mainnet: 'bg-status-safe',     // Mint Green
};

/**
 * Toggles between Testnet and Mainnet.
 * Disabled while a transaction is pending (shows tooltip).
 */
export function NetworkSelector() {
  const { network, setNetwork } = useWalletStore();
  const isTransactionPending = useContractStore((s) => s.isTransactionPending);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleToggle = (next: StellarNetwork) => {
    if (isTransactionPending) return;
    if (next !== network) {
      setNetwork(next);
    }
  };

  const networks: StellarNetwork[] = ['testnet', 'mainnet'];

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => isTransactionPending && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => isTransactionPending && setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <div
        className={[
          'flex rounded-lg border overflow-hidden',
          isTransactionPending
            ? 'border-frost-cyan/10 opacity-50 cursor-not-allowed'
            : 'border-frost-cyan/20',
        ].join(' ')}
        role="group"
        aria-label="Network selector"
      >
        {networks.map((net) => {
          const isActive = network === net;
          return (
            <button
              key={net}
              onClick={() => handleToggle(net)}
              disabled={isTransactionPending}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium min-h-9 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan focus-visible:ring-inset',
                isActive
                  ? 'bg-frost-cyan/15 text-frost-white'
                  : 'bg-transparent text-frost-gray hover:text-frost-white hover:bg-frost-cyan/5',
                isTransactionPending ? 'cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
              aria-pressed={isActive}
              aria-label={`Switch to ${NETWORK_LABELS[net]}`}
            >
              {/* Network indicator dot */}
              <span
                className={[
                  'h-1.5 w-1.5 rounded-full flex-shrink-0',
                  isActive ? NETWORK_INDICATOR[net] : 'bg-frost-gray/40',
                ].join(' ')}
                aria-hidden="true"
              />
              {NETWORK_LABELS[net]}
            </button>
          );
        })}
      </div>

      {/* Pending transaction tooltip */}
      {showTooltip && isTransactionPending && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50
                     px-3 py-1.5 rounded-lg bg-arctic-slate border border-frost-cyan/20
                     text-xs text-frost-gray whitespace-nowrap shadow-frost-glow pointer-events-none"
          role="tooltip"
          aria-live="polite"
        >
          Network switch unavailable while transaction is pending
          {/* Tooltip arrow */}
          <span
            className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-arctic-slate"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export default NetworkSelector;
