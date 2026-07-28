import { create } from 'zustand';
import type { ContractState, TransactionEntry } from '@/lib/types';

export interface ContractStoreState {
  contractState: ContractState | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  transactions: TransactionEntry[];
  isTransactionPending: boolean;

  fetchContractState: () => Promise<void>;
  submitTransaction: (type: string, params: unknown) => Promise<string>;
  setError: (msg: string) => void;
  clearError: () => void;
  addTransaction: (entry: TransactionEntry) => void;
}

export const useContractStore = create<ContractStoreState>((set, get) => ({
  contractState: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  transactions: [],
  isTransactionPending: false,

  fetchContractState: async () => {
    set({ isLoading: true, error: null });
    try {
      // Placeholder: actual SorobanService.getContractState() will be wired in task 5.1
      // const state = await sorobanService.getContractState();
      // set({ contractState: state, lastFetchedAt: Date.now(), isLoading: false });
      set({ lastFetchedAt: Date.now(), isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contract state';
      set({ error: message, isLoading: false });
    }
  },

  submitTransaction: async (type: string, params: unknown) => {
    set({ isTransactionPending: true, error: null });
    try {
      // Placeholder: actual TX build → sign → submit flow will be wired in task 5.1
      // const txHash = await buildAndSubmitTransaction(type, params);
      // await get().fetchContractState();
      // return txHash;
      set({ isTransactionPending: false });
      return '';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed';
      set({ error: message, isTransactionPending: false });
      throw err;
    }
  },

  setError: (msg: string) => {
    set({ error: msg });
  },

  clearError: () => {
    set({ error: null });
  },

  addTransaction: (entry: TransactionEntry) => {
    set((state) => ({
      transactions: [entry, ...state.transactions],
    }));
  },
}));
