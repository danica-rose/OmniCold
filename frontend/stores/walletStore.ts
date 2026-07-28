'use client';

import { create } from 'zustand';
import type { StellarNetwork } from '@/lib/types';
import { NETWORK_CONFIG } from '@/lib/constants';

const NETWORK_STORAGE_KEY = 'omnicold-network';

function getPersistedNetwork(): StellarNetwork {
  // Hardcoded to testnet — network selector removed
  return 'testnet';
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  network: StellarNetwork;
  xlmBalance: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  setNetwork: (network: StellarNetwork) => void;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  isConnecting: false,
  network: getPersistedNetwork(),
  xlmBalance: null,

  connect: async () => {
    set({ isConnecting: true });
    try {
      const freighterApi = await import('@stellar/freighter-api');
      
      // First check if extension is reachable
      const connected = await freighterApi.isConnected();
      if (!connected) {
        // Extension might be installed but not set up — try requestAccess anyway
        // as it will prompt the user to allow the connection
      }
      
      const publicKey = await freighterApi.requestAccess();
      
      if (!publicKey || publicKey === '') {
        throw new Error('No public key returned');
      }

      set({
        address: publicKey,
        isConnected: true,
        isConnecting: false,
      });
      
      // Fetch XLM balance after connecting
      get().fetchBalance();
    } catch (error) {
      console.error('[WalletStore] Connection failed:', error);
      set({ isConnecting: false });
    }
  },

  disconnect: () => {
    set({
      address: null,
      isConnected: false,
      isConnecting: false,
      xlmBalance: null,
    });
  },

  setNetwork: (network: StellarNetwork) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(NETWORK_STORAGE_KEY, network);
    }
    set({ network });
    // Re-fetch balance on network change
    const { address } = get();
    if (address) {
      get().fetchBalance();
    }
  },

  fetchBalance: async () => {
    const { address, network } = get();
    if (!address) {
      set({ xlmBalance: null });
      return;
    }
    try {
      const horizonUrl = NETWORK_CONFIG[network].horizonUrl;
      const response = await fetch(`${horizonUrl}/accounts/${address}`);
      if (!response.ok) {
        if (response.status === 404) {
          set({ xlmBalance: '0.00' }); // Account not funded
          return;
        }
        throw new Error('Failed to fetch account');
      }
      const data = await response.json();
      const nativeBalance = data.balances?.find((b: any) => b.asset_type === 'native');
      set({ xlmBalance: nativeBalance ? parseFloat(nativeBalance.balance).toFixed(2) : '0.00' });
    } catch (error) {
      console.error('[WalletStore] Failed to fetch balance:', error);
      set({ xlmBalance: null });
    }
  },
}));
