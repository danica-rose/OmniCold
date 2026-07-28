'use client';

import { useWalletStore } from '@/stores/walletStore';

export function useWallet() {
  const store = useWalletStore();
  return {
    address: store.address,
    isConnected: store.isConnected,
    isConnecting: store.isConnecting,
    network: store.network,
    connect: store.connect,
    disconnect: store.disconnect,
    setNetwork: store.setNetwork,
  };
}
