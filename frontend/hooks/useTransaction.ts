'use client';

import { useCallback } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { showToast } from '@/components/shared/ToastNotification';

export function useTransaction() {
  const { submitTransaction, isTransactionPending } = useContractStore();

  const submit = useCallback(async (type: string, params: unknown) => {
    try {
      const txHash = await submitTransaction(type, params);
      return txHash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      showToast('error', message);
      throw err;
    }
  }, [submitTransaction]);

  return {
    submit,
    isPending: isTransactionPending,
  };
}
