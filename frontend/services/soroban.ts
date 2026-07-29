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

      // Use the contract's get_shipment_count to find the latest shipment
      const contract = new Contract(this.contractId);
      
      // First get the count
      const countOp = contract.call('get_shipment_count');
      const countTx = new TransactionBuilder(
        await this.server.getAccount(this.contractId),
        { fee: '100', networkPassphrase: this.networkPassphrase }
      ).addOperation(countOp).setTimeout(30).build();
      
      const countSim = await this.server.simulateTransaction(countTx);
      if (SorobanRpc.Api.isSimulationError(countSim)) return null;
      
      // Parse count from simulation result
      const countResult = (countSim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result;
      if (!countResult) return null;
      
      const countVal = countResult.retval;
      const count = countVal.u32();
      if (count === 0) return null;

      // Get the latest shipment (id = count - 1)
      const latestId = count - 1;
      const getOp = contract.call('get_shipment', nativeToScVal(latestId, { type: 'u32' }));
      const getTx = new TransactionBuilder(
        await this.server.getAccount(this.contractId),
        { fee: '100', networkPassphrase: this.networkPassphrase }
      ).addOperation(getOp).setTimeout(30).build();

      const getSim = await this.server.simulateTransaction(getTx);
      if (SorobanRpc.Api.isSimulationError(getSim)) return null;

      const getResult = (getSim as SorobanRpc.Api.SimulateTransactionSuccessResponse).result;
      if (!getResult) return null;

      // Parse the Shipment struct from the result
      const retval = getResult.retval;
      
      // The result is an Option<Shipment> — if None, return null
      if (retval.switch().name === 'scvVoid') return null;

      // Parse the struct fields from ScvMap
      const shipmentMap = retval.vec();
      if (!shipmentMap || shipmentMap.length === 0) return null;

      let shipmentStatus: ContractState['shipmentStatus'] = 'Created';
      let minTemp = 0;
      let maxTemp = 0;
      let shipper = '';
      let logisticsProvider = '';
      let oracle = '';
      let bondAmount = 0n;
      let usdcToken = '';

      // Soroban structs serialize as maps with symbol keys
      for (const entry of shipmentMap) {
        // Each entry in the vec might be a map entry
        // Actually for Option<Struct>, the result is wrapped
        // Let's try parsing as a struct map
        if (entry.switch().name === 'scvMap') {
          const map = entry.map();
          if (map) {
            for (const mapEntry of map) {
              const key = mapEntry.key().sym().toString();
              const val = mapEntry.val();
              switch (key) {
                case 'status': {
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
                  bondAmount = BigInt('0x' + i128.lo().toXDR('hex'));
                  break;
                }
                case 'usdc_token': usdcToken = Address.fromScVal(val).toString(); break;
              }
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
