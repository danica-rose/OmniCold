'use client';

import { useEffect, useRef } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { getPollingService } from '@/services/polling';

export function usePolling() {
  const { contractState, fetchContractState } = useContractStore();
  const pollingRef = useRef(getPollingService());

  const shouldPoll = contractState?.shipmentStatus === 'Active';

  useEffect(() => {
    const polling = pollingRef.current;

    if (shouldPoll) {
      polling.start(fetchContractState);
    } else {
      polling.stop();
    }

    return () => {
      polling.stop();
    };
  }, [shouldPoll, fetchContractState]);

  return {
    isPolling: pollingRef.current.active,
  };
}
