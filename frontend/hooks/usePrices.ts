'use client';

import { useEffect, useState } from 'react';
import { fetchPrices, type PriceData } from '@/services/prices';

const FALLBACK: PriceData = { xlmUsd: 0.12, usdPhp: 56.50 };

export function usePrices() {
  const [prices, setPrices] = useState<PriceData>(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchPrices();
        if (mounted) {
          setPrices(data);
          setIsLoading(false);
        }
      } catch {
        if (mounted) setIsLoading(false);
      }
    }

    load();

    // Refresh every 60s
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { prices, isLoading };
}
