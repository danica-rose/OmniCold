'use client';

import { useState } from 'react';
import { truncateAddress } from '@/lib/utils';
import { showToast } from './ToastNotification';

interface TruncatedAddressProps {
  /** Full Stellar address */
  address: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a truncated Stellar address with:
 * - Tooltip showing full address on hover
 * - Copy-to-clipboard button with toast confirmation
 */
export function TruncatedAddress({ address, className = '' }: TruncatedAddressProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      showToast('success', 'Address copied to clipboard');
    } catch {
      showToast('error', 'Failed to copy address');
    }
  };

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <code className="text-sm font-mono text-frost-gray">
        {truncateAddress(address)}
      </code>

      <button
        onClick={handleCopy}
        className="p-1 rounded hover:bg-frost-white/10 transition-colors min-h-[28px] min-w-[28px] flex items-center justify-center"
        aria-label={`Copy address ${truncateAddress(address)}`}
        title="Copy full address"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-frost-gray"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-md bg-arctic-deep border border-frost-cyan/20 text-xs font-mono text-frost-white whitespace-nowrap z-10 shadow-frost-glow"
          role="tooltip"
        >
          {address}
        </span>
      )}
    </span>
  );
}

export default TruncatedAddress;
