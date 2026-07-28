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
      const contract = new Contract(this.contractId);
      // This is a simplified implementation - in production, you'd use getLedgerEntries
      // to read specific storage keys from the contract
      // For now, return null to indicate no state (contract not yet initialized or not found)
      return null;
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
      throw new Error(`Simulation failed: ${simulated.error}`);
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
