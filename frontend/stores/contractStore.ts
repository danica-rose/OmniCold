import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  currentShipmentId: number | null;

  fetchContractState: () => Promise<void>;
  submitTransaction: (type: string, params: unknown) => Promise<string>;
  setError: (msg: string) => void;
  clearError: () => void;
  addTransaction: (entry: TransactionEntry) => void;
  setContractState: (state: ContractState) => void;
}

export const useContractStore = create<ContractStoreState>()(
  persist(
    (set, get) => ({
      contractState: null,
      isLoading: false,
      error: null,
      lastFetchedAt: null,
      transactions: [],
      isTransactionPending: false,
      currentShipmentId: null,

      fetchContractState: async () => {
        set({ isLoading: true, error: null });
        try {
          const network = useWalletStore.getState().network;
          const service = getSorobanService(network);
          const state = await service.getContractState();
          if (state) {
            set({ contractState: state, lastFetchedAt: Date.now(), isLoading: false });
          } else {
            // Keep existing local state if on-chain read fails
            set({ lastFetchedAt: Date.now(), isLoading: false });
          }
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
              unsignedXdr = await service.buildDepositBond(
                p.logisticsProvider as string,
                get().currentShipmentId ?? undefined
              );
              break;
            }
            case 'report_temperature': {
              unsignedXdr = await service.buildReportTemperature(
                p.oracle as string,
                p.temperature as number,
                get().currentShipmentId ?? undefined
              );
              break;
            }
            case 'confirm_delivery': {
              unsignedXdr = await service.buildConfirmDelivery(
                p.shipper as string,
                get().currentShipmentId ?? undefined
              );
              break;
            }
            default:
              throw new Error(`Unknown transaction type: ${type}`);
          }

          // Sign with Freighter
          const signedXdr = await signTransaction(unsignedXdr, network);

          // Show progress - import showToast at top won't work in store, 
          // so we'll set a status message
          set({ error: null });

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

          // Update local state based on transaction type
          const currentState = get().contractState;
          if (type === 'initialize_shipment') {
            const initParams = p as unknown as InitializeShipmentParams;
            const newState: ContractState = {
              shipmentStatus: 'Created',
              minTemp: initParams.minTemp,
              maxTemp: initParams.maxTemp,
              shipper: initParams.shipper,
              logisticsProvider: initParams.logisticsProvider,
              oracle: initParams.oracle,
              bondAmount: initParams.bondAmount,
              usdcToken: initParams.usdcToken,
            };
            set({ contractState: newState, currentShipmentId: 0 });
          } else if (type === 'deposit_bond' && currentState) {
            set({ contractState: { ...currentState, shipmentStatus: 'Active' } });
          } else if (type === 'report_temperature' && currentState) {
            const temp = p.temperature as number;
            if (temp < currentState.minTemp || temp > currentState.maxTemp) {
              set({ contractState: { ...currentState, shipmentStatus: 'Breached' } });
            }
          } else if (type === 'confirm_delivery' && currentState) {
            set({ contractState: { ...currentState, shipmentStatus: 'Delivered' } });
          }

          set({ isTransactionPending: false });

          // Also try to fetch from chain after a delay
          setTimeout(() => get().fetchContractState(), 3000);

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

      setContractState: (state: ContractState) => {
        set({ contractState: state });
      },
    }),
    {
      name: 'omnicold-contract-store',
      partialize: (state) => ({
        contractState: state.contractState,
        transactions: state.transactions,
        currentShipmentId: state.currentShipmentId,
      }),
      // Custom serialization for BigInt
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str, (key, value) => {
            if (typeof value === 'string' && value.startsWith('__bigint__')) {
              return BigInt(value.slice(10));
            }
            return value;
          });
          return parsed;
        },
        setItem: (name, value) => {
          const str = JSON.stringify(value, (key, val) => {
            if (typeof val === 'bigint') {
              return `__bigint__${val.toString()}`;
            }
            return val;
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
