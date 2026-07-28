'use client';

import { usePrices } from '@/hooks/usePrices';
import { convertUsdcAmount } from '@/services/prices';

interface CurrencyDisplayProps {
  /** USDC amount in stroops (bigint) */
  stroops: bigint;
  /** Show as compact (single line) or expanded (multi-line) */
  variant?: 'compact' | 'expanded';
}

/**
 * Displays a USDC amount with XLM and PHP equivalents.
 * Fetches live prices from CoinGecko.
 */
export function CurrencyDisplay({ stroops, variant = 'compact' }: CurrencyDisplayProps) {
  const { prices, isLoading } = usePrices();
  const converted = convertUsdcAmount(stroops, prices);

  if (variant === 'expanded') {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-frost-white tabular-nums">{converted.usdc}</span>
          <span className="text-sm font-medium text-frost-gray">USDC</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-frost-gray">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-frost-cyan/60" />
            ≈ {converted.xlm} XLM
          </span>
          <span className="text-frost-gray/30">|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-status-safe/60" />
            ≈ ₱{converted.php} PHP
          </span>
          {isLoading && <span className="text-frost-gray/40 text-[10px]">(loading rates…)</span>}
        </div>
      </div>
    );
  }

  // Compact variant
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="font-mono font-medium text-frost-white">{converted.usdc} USDC</span>
      <span className="text-frost-gray/60 text-xs">
        ({converted.xlm} XLM / ₱{converted.php})
      </span>
    </span>
  );
}

export default CurrencyDisplay;
