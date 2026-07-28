import type { StellarNetwork } from '@/lib/types';

export interface PriceData {
  xlmUsd: number;   // XLM price in USD
  usdPhp: number;   // USD to PHP exchange rate
}

const FALLBACK_PRICES: PriceData = {
  xlmUsd: 0.12,    // Fallback XLM/USD
  usdPhp: 56.50,   // Fallback USD/PHP
};

let cachedPrices: PriceData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60_000; // 1 minute cache

/**
 * Fetch live prices from public APIs.
 * Falls back to hardcoded values if APIs are unavailable.
 */
export async function fetchPrices(): Promise<PriceData> {
  const now = Date.now();
  if (cachedPrices && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedPrices;
  }

  try {
    // Fetch XLM and PHP rates from a free API
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd,php'
    );
    
    if (!response.ok) throw new Error('Price API unavailable');
    
    const data = await response.json();
    const xlmUsd = data?.stellar?.usd ?? FALLBACK_PRICES.xlmUsd;
    const xlmPhp = data?.stellar?.php ?? (xlmUsd * FALLBACK_PRICES.usdPhp);
    const usdPhp = xlmPhp / xlmUsd;

    cachedPrices = { xlmUsd, usdPhp };
    lastFetchTime = now;
    return cachedPrices;
  } catch (error) {
    console.warn('[PriceService] Using fallback prices:', error);
    cachedPrices = FALLBACK_PRICES;
    lastFetchTime = now;
    return FALLBACK_PRICES;
  }
}

/**
 * Convert USDC amount (in stroops) to display values in multiple currencies.
 */
export function convertUsdcAmount(
  stroops: bigint,
  prices: PriceData
): { usdc: string; xlm: string; php: string } {
  const usdcAmount = Number(stroops) / 10_000_000;
  const xlmAmount = usdcAmount / prices.xlmUsd;
  const phpAmount = usdcAmount * prices.usdPhp;

  return {
    usdc: usdcAmount.toFixed(2),
    xlm: xlmAmount.toFixed(2),
    php: phpAmount.toFixed(2),
  };
}

/**
 * Format XLM balance with PHP equivalent.
 */
export function formatXlmWithPhp(
  xlmBalance: string,
  prices: PriceData
): { xlm: string; php: string; usd: string } {
  const xlm = parseFloat(xlmBalance);
  const usd = xlm * prices.xlmUsd;
  const php = usd * prices.usdPhp;

  return {
    xlm: xlm.toFixed(2),
    php: php.toFixed(2),
    usd: usd.toFixed(2),
  };
}
