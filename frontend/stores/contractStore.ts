import { create } from 'zustand';
import type { ContractState, TransactionEntry, InitializeShipmentParams } from '@/lib/types';
import { getSorobanService } from '@/services/soroban';
import { signTransaction } from '@/services/freighter';
import { useWalletStore } from '@/stores/walletStore';

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
      const network = useWalletStore.getState().network;
      const service = getSorobanService(network);
      const state = await service.getContractState();
      set({ contractState: state, lastFetchedAt: Date.now(), isLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch contract state';
      set({ error: message, isLoading: false });
    }
  },

  submitTransaction: async (type: string, params: unknown) => {
    set({ isTransactionPending: true, error: null });
    try {
      const network = useWalletStore.getState().network;
      const service = getSorobanService(network);
      const p = params as Record<string, unknown>;

      // Build the unsigned transaction XDR based on type
      let unsignedXdr: string;

      switch (type) {
        case 'initialize_shipment': {
          const initParams = p as unknown as InitializeShipmentParams;
          unsignedXdr = await service.buildInitializeShipment(initParams);
          break;
        }
        case 'deposit_bond': {
          unsignedXdr = await service.buildDepositBond(p.logisticsProvider as string);
          break;
        }
        case 'report_temperature': {
          unsignedXdr = await service.buildReportTemperature(
            p.oracle as string,
            p.temperature as number
          );
          break;
        }
        case 'confirm_delivery': {
          unsignedXdr = await service.buildConfirmDelivery(p.shipper as string);
          break;
        }
        default:
          throw new Error(`Unknown transaction type: ${type}`);
      }

      // Sign with Freighter
      const signedXdr = await signTransaction(unsignedXdr, network);

      // Submit to network
      const result = await service.submitTransaction(signedXdr);

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed on-chain');
      }

      // Record the transaction
      const entry: TransactionEntry = {
        id: result.txHash,
        type: type === 'initialize_shipment' ? 'initialize' : type as TransactionEntry['type'],
        invokerAddress: useWalletStore.getState().address || '',
        timestamp: Date.now(),
        txHash: result.txHash,
        status: 'success',
      };
      get().addTransaction(entry);

      set({ isTransactionPending: false });
      return result.txHash;
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
