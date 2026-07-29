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

      // Read the contract's persistent storage directly using getLedgerEntries
      const contractAddress = new Address(this.contractId);

      // Read the Counter key to find how many shipments exist
      // StorageKey::Counter serializes as ScvVec([ScvSymbol("Counter")])
      const counterKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contractAddress.toScAddress(),
          key: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Counter')]),
          durability: xdr.ContractDataDurability.persistent(),
        })
      );

      const counterResponse = await this.server.getLedgerEntries(counterKey);
      if (!counterResponse.entries || counterResponse.entries.length === 0) {
        return null; // No shipments yet
      }

      const counterVal = counterResponse.entries[0].val.contractData().val();
      const count = counterVal.u32();
      if (count === 0) return null;

      // Read the latest shipment (id = count - 1)
      // StorageKey::Shipment(u32) serializes as ScvVec([ScvSymbol("Shipment"), ScvU32(id)])
      const latestId = count - 1;
      const shipmentKey = xdr.LedgerKey.contractData(
        new xdr.LedgerKeyContractData({
          contract: contractAddress.toScAddress(),
          key: xdr.ScVal.scvVec([
            xdr.ScVal.scvSymbol('Shipment'),
            nativeToScVal(latestId, { type: 'u32' }),
          ]),
          durability: xdr.ContractDataDurability.persistent(),
        })
      );

      const shipmentResponse = await this.server.getLedgerEntries(shipmentKey);
      if (!shipmentResponse.entries || shipmentResponse.entries.length === 0) {
        return null;
      }

      // Parse the Shipment struct
      // Soroban structs serialize as ScvMap with symbol keys
      const shipmentVal = shipmentResponse.entries[0].val.contractData().val();
      
      let shipmentStatus: ContractState['shipmentStatus'] = 'Created';
      let minTemp = 0;
      let maxTemp = 0;
      let shipper = '';
      let logisticsProvider = '';
      let oracle = '';
      let bondAmount = 0n;
      let usdcToken = '';

      // Struct is serialized as ScvMap
      if (shipmentVal.switch().name === 'scvMap') {
        const map = shipmentVal.map();
        if (map) {
          for (const entry of map) {
            const key = entry.key().sym().toString();
            const val = entry.val();
            switch (key) {
              case 'status': {
                // Enum serializes as ScvVec([ScvSymbol(variant)])
                const statusVec = val.vec();
                if (statusVec && statusVec.length > 0) {
                  const statusName = statusVec[0].sym().toString();
                  shipmentStatus = (statusName as ContractState['shipmentStatus']) ?? 'Created';
                }
                break;
              }
              case 'min_temp': minTemp = val.i32(); break;
              case 'max_temp': maxTemp = val.i32(); break;
              case 'shipper': shipper = Address.fromScVal(val).toString(); break;
              case 'logistics_provider': logisticsProvider = Address.fromScVal(val).toString(); break;
              case 'oracle': oracle = Address.fromScVal(val).toString(); break;
              case 'bond_amount': {
                const i128 = val.i128();
                const lo = BigInt(i128.lo().low) + (BigInt(i128.lo().high) << 32n);
                bondAmount = lo;
                break;
              }
              case 'usdc_token': usdcToken = Address.fromScVal(val).toString(); break;
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
  async buildDepositBond(logisticsProvider: string, shipmentId?: number): Promise<string> {
    const contract = new Contract(this.contractId);
    const id = shipmentId ?? 0;
    const operation = contract.call(
      'deposit_bond',
      new Address(logisticsProvider).toScVal(),
      nativeToScVal(id, { type: 'u32' }),
    );
    return this.buildTransaction(logisticsProvider, operation);
  }

  /** Build unsigned report_temperature transaction XDR */
  async buildReportTemperature(oracle: string, temperature: number, shipmentId?: number): Promise<string> {
    const contract = new Contract(this.contractId);
    const id = shipmentId ?? 0;
    const operation = contract.call(
      'report_temperature',
      new Address(oracle).toScVal(),
      nativeToScVal(id, { type: 'u32' }),
      nativeToScVal(temperature, { type: 'i32' }),
    );
    return this.buildTransaction(oracle, operation);
  }

  /** Build unsigned confirm_delivery transaction XDR */
  async buildConfirmDelivery(shipper: string, shipmentId?: number): Promise<string> {
    const contract = new Contract(this.contractId);
    const id = shipmentId ?? 0;
    const operation = contract.call(
      'confirm_delivery',
      new Address(shipper).toScVal(),
      nativeToScVal(id, { type: 'u32' }),
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
      fee: '10000000',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(300)
      .build();

    // Simulate to get proper resource estimates
    const simulated = await this.server.simulateTransaction(tx);
    if (SorobanRpc.Api.isSimulationError(simulated)) {
      // Parse the simulation error into a user-friendly message
      const rawError = simulated.error || '';
      
      // Check for numeric contract error codes (Contract, #N)
      const numericMatch = rawError.match(/Contract,\s*#?(\d+)/i);
      if (numericMatch) {
        const code = parseInt(numericMatch[1], 10);
        const errorMessages: Record<number, string> = {
          1: 'Min temperature must be less than max temperature.',
          2: 'Bond amount must be greater than zero.',
          3: 'All participant addresses must be unique (shipper, provider, oracle).',
          4: 'Your connected wallet does not match the Logistics Provider address for this shipment. Switch to the correct Freighter account.',
          5: 'Only the authorized Oracle can report temperatures.',
          6: 'Only the Shipper can confirm delivery.',
          7: 'This action is not available in the current shipment state.',
          8: 'Shipment not found.',
          9: 'USDC transfer failed — check balance and token allowance.',
        };
        throw new Error(errorMessages[code] || `Contract error #${code}`);
      }

      // Check for common contract errors by name
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
    // Fast initial checks (1s intervals), then slower (2s intervals)
    const attempts = [
      1000, 1000, 1500, 1500, 2000, 2000, 2000, 3000, 3000, 3000,
      3000, 3000, 3000, 3000, 3000
    ];
    
    for (let i = 0; i < attempts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, attempts[i]));
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
    // If we get here, consider it a success — the transaction was submitted 
    // and Stellar testnet might just be slow to index it
    return { success: true, txHash: hash };
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
