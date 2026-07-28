'use client';

import { useEffect } from 'react';
import { useContractStore } from '@/stores/contractStore';

export function useContractState() {
  const store = useContractStore();

  useEffect(() => {
    store.fetchContractState();
  }, []);

  return {
    contractState: store.contractState,
    isLoading: store.isLoading,
    error: store.error,
    transactions: store.transactions,
    refetch: store.fetchContractState,
  };
}
