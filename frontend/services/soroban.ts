import {
  SorobanRpc,
  TransactionBuilder,
  Contract,
  xdr,
  Address,
  nativeToScVal,
} from '@stellar/stellar-sdk';
import { NETWORK_CONFIG } from '@/lib/constants';
import { ContractState, StellarNetwork, InitializeShipmentParams } from '@/lib/types';
import { mapContractError } from '@/lib/errors';

export interface TransactionResult {
  success: boolean;
  txHash: string;
  error?: string;
}

export class SorobanService {
  private server: SorobanRpc.Server;
  private contractId: string;
  private networkPassphrase: string;
  private network: StellarNetwork;

  constructor(network: StellarNetwork) {
    const config = NETWORK_CONFIG[network];
    this.server = new SorobanRpc.Server(config.rpcUrl);
    this.contractId = config.contractId;
    this.networkPassphrase = config.passphrase;
    this.network = network;
  }

  /** Read all contract storage keys and return typed ContractState */
  async getContractState(): Promise<ContractState | null> {
    try {
      if (!this.contractId) return null;

      const contractAddress = new Address(this.contractId);

      // The contract uses enum StorageKey variants as keys in persistent storage.
      // Soroban serializes enum variants as ScvVec([ScvSymbol(variant_name)]) for
      // unit variants (no associated data).
      const makeEnumKey = (variantName: string): xdr.ScVal => {
        return xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(variantName)]);
      };

      // Build ledger keys for each storage entry
      const keyNames = [
        'ShipmentState',
        'MinTemp',
        'MaxTemp',
        'Shipper',
        'LogisticsProvider',
        'Oracle',
        'BondAmount',
        'UsdcToken',
      ];

      const ledgerKeys = keyNames.map((name) =>
        xdr.LedgerKey.contractData(
          new xdr.LedgerKeyContractData({
            contract: contractAddress.toScAddress(),
            key: makeEnumKey(name),
            durability: xdr.ContractDataDurability.persistent(),
          })
        )
      );

      const response = await this.server.getLedgerEntries(...ledgerKeys);

      if (!response.entries || response.entries.length === 0) {
        return null; // Contract not initialized yet
      }

      // Parse each entry
      let shipmentStatus: ContractState['shipmentStatus'] = 'Created';
      let minTemp = 0;
      let maxTemp = 0;
      let shipper = '';
      let logisticsProvider = '';
      let oracle = '';
      let bondAmount = 0n;
      let usdcToken = '';

      for (const entry of response.entries) {
        const dataEntry = entry.val.contractData();
        const key = dataEntry.key();
        const val = dataEntry.val();

        // Extract the enum variant name from ScvVec([ScvSymbol(name)])
        if (key.switch().name === 'scvVec') {
          const vec = key.vec();
          if (vec && vec.length > 0 && vec[0].switch().name === 'scvSymbol') {
            const variantName = vec[0].sym().toString();

            switch (variantName) {
              case 'ShipmentState': {
                // ShipmentStatus is also an enum: ScvVec([ScvSymbol(variant)])
                if (val.switch().name === 'scvVec') {
                  const statusVec = val.vec();
                  if (statusVec && statusVec.length > 0) {
                    const statusName = statusVec[0].sym().toString();
                    const statusMap: Record<string, ContractState['shipmentStatus']> = {
                      Created: 'Created',
                      Active: 'Active',
                      Delivered: 'Delivered',
                      Breached: 'Breached',
                    };
                    shipmentStatus = statusMap[statusName] ?? 'Created';
                  }
                }
                break;
              }
              case 'MinTemp':
                minTemp = val.i32();
                break;
              case 'MaxTemp':
                maxTemp = val.i32();
                break;
              case 'Shipper':
                shipper = Address.fromScVal(val).toString();
                break;
              case 'LogisticsProvider':
                logisticsProvider = Address.fromScVal(val).toString();
                break;
              case 'Oracle':
                oracle = Address.fromScVal(val).toString();
                break;
              case 'BondAmount': {
                const i128 = val.i128();
                const lo = BigInt('0x' + i128.lo().toXDR('hex'));
                const hi = BigInt('0x' + i128.hi().toXDR('hex'));
                bondAmount = (hi << 64n) | lo;
                break;
              }
              case 'UsdcToken':
                usdcToken = Address.fromScVal(val).toString();
                break;
            }
          }
        }
      }

      return {
        shipmentStatus,
        minTemp,
        maxTemp,
        shipper,
        logisticsProvider,
        oracle,
        bondAmount,
        usdcToken,
      };
    } catch (error) {
      console.error('Failed to fetch contract state:', error);
      return null;
    }
  }

  /** Build unsigned initialize_shipment transaction XDR */
  async buildInitializeShipment(params: InitializeShipmentParams): Promise<string> {
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      'initialize_shipment',
      new Address(params.shipper).toScVal(),
      new Address(params.usdcToken).toScVal(),
      nativeToScVal(params.minTemp, { type: 'i32' }),
      nativeToScVal(params.maxTemp, { type: 'i32' }),
      new Address(params.logisticsProvider).toScVal(),
      new Address(params.oracle).toScVal(),
      nativeToScVal(params.bondAmount, { type: 'i128' }),
    );
    return this.buildTransaction(params.shipper, operation);
  }

  /** Build unsigned deposit_bond transaction XDR */
  async buildDepositBond(logisticsProvider: string): Promise<string> {
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      'deposit_bond',
      new Address(logisticsProvider).toScVal(),
    );
    return this.buildTransaction(logisticsProvider, operation);
  }

  /** Build unsigned report_temperature transaction XDR */
  async buildReportTemperature(oracle: string, temperature: number): Promise<string> {
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      'report_temperature',
      new Address(oracle).toScVal(),
      nativeToScVal(temperature, { type: 'i32' }),
    );
    return this.buildTransaction(oracle, operation);
  }

  /** Build unsigned confirm_delivery transaction XDR */
  async buildConfirmDelivery(shipper: string): Promise<string> {
    const contract = new Contract(this.contractId);
    const operation = contract.call(
      'confirm_delivery',
      new Address(shipper).toScVal(),
    );
    return this.buildTransaction(shipper, operation);
  }

  /** Submit a signed transaction and return result */
  async submitTransaction(signedXdr: string): Promise<TransactionResult> {
    try {
      const tx = TransactionBuilder.fromXDR(signedXdr, this.networkPassphrase);
      const response = await this.server.sendTransaction(tx);

      if (response.status === 'PENDING') {
        // Poll for completion
        const result = await this.pollTransactionStatus(response.hash);
        return result;
      }

      return {
        success: false,
        txHash: response.hash,
        error: response.status === 'ERROR' ? 'Transaction submission failed' : `Transaction status: ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        txHash: '',
        error: error instanceof Error ? error.message : 'Unknown submission error',
      };
    }
  }

  /** Parse contract error code from a failed transaction */
  parseContractError(error: unknown): string | null {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: number }).code;
      return mapContractError(code);
    }
    return null;
  }

  /** Internal: build a transaction from an operation */
  private async buildTransaction(sourceAddress: string, operation: xdr.Operation): Promise<string> {
    const account = await this.server.getAccount(sourceAddress);
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Simulate to get proper resource estimates
    const simulated = await this.server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      // Parse the simulation error into a user-friendly message
      const rawError = simulated.error || '';
      
      // Check for common contract errors
      if (rawError.includes('AlreadyInitialized') || rawError.includes('MissingValue')) {
        throw new Error('This contract has already been initialized. You need to deploy a new contract instance for a new shipment.');
      }
      if (rawError.includes('NotLogisticsProvider')) {
        throw new Error('Only the designated Logistics Provider can perform this action.');
      }
      if (rawError.includes('NotOracle')) {
        throw new Error('Only the authorized Oracle can report temperatures.');
      }
      if (rawError.includes('NotShipper')) {
        throw new Error('Only the Shipper can confirm delivery.');
      }
      if (rawError.includes('InvalidState')) {
        throw new Error('This action is not available in the current shipment state.');
      }
      if (rawError.includes('InvalidTempRange')) {
        throw new Error('Min temperature must be less than max temperature.');
      }
      if (rawError.includes('InvalidBondAmount')) {
        throw new Error('Bond amount must be greater than zero.');
      }
      if (rawError.includes('DuplicateParticipant')) {
        throw new Error('All participant addresses must be unique (shipper, provider, oracle).');
      }
      if (rawError.includes('TransferFailed')) {
        throw new Error('USDC transfer failed — check balance and token allowance.');
      }
      
      // Fallback: clean up the raw error for display
      const cleanError = rawError
        .replace(/\[Diagnostic Event\].*$/gs, '')
        .replace(/HostError:.*?Error\(([^)]+)\)/i, 'Contract error: $1')
        .trim();
      
      throw new Error(cleanError || 'Transaction simulation failed. The contract rejected this operation.');
    }

    const prepared = SorobanRpc.assembleTransaction(tx, simulated).build();
    return prepared.toXDR();
  }

  /** Internal: poll for transaction completion */
  private async pollTransactionStatus(hash: string): Promise<TransactionResult> {
    const maxAttempts = 10;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const result = await this.server.getTransaction(hash);
        if (result.status === 'SUCCESS') {
          return { success: true, txHash: hash };
        }
        if (result.status === 'FAILED') {
          return { success: false, txHash: hash, error: 'Transaction failed on-chain' };
        }
        // NOT_FOUND means still pending
      } catch {
        // Continue polling
      }
    }
    return { success: false, txHash: hash, error: 'Transaction confirmation timeout' };
  }
}

/** Create a singleton-like service for the given network */
let currentService: SorobanService | null = null;
let currentNetwork: StellarNetwork | null = null;

export function getSorobanService(network: StellarNetwork): SorobanService {
  if (!currentService || currentNetwork !== network) {
    currentService = new SorobanService(network);
    currentNetwork = network;
  }
  return currentService;
}
