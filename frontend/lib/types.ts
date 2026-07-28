// Shared TypeScript types for OmniCold Frontend Dashboard

// --- Union Types ---

/** Lifecycle state of a shipment on-chain */
export type ShipmentStatus = 'Created' | 'Active' | 'Delivered' | 'Breached';

/** Stellar network environment */
export type StellarNetwork = 'testnet' | 'mainnet';

/** Dashboard user role */
export type UserRole = 'shipper' | 'provider' | 'oracle';

/** Current state of the USDC bond */
export type BondStatus = 'held' | 'released' | 'slashed';

/** Temperature zone classification relative to thresholds */
export type TemperatureZone = 'safe' | 'warning' | 'breach';

// --- Data Interfaces ---

/** Contract state mirroring on-chain storage */
export interface ContractState {
  shipmentStatus: ShipmentStatus;
  minTemp: number; // centidegrees Celsius (i32)
  maxTemp: number; // centidegrees Celsius (i32)
  shipper: string; // Stellar address
  logisticsProvider: string; // Stellar address
  oracle: string; // Stellar address
  bondAmount: bigint; // i128 (stroops)
  usdcToken: string; // Stellar address
}

/** A recorded transaction against the contract */
export interface TransactionEntry {
  id: string;
  type:
    | 'initialize'
    | 'deposit_bond'
    | 'report_temperature'
    | 'confirm_delivery'
    | 'breach_slash';
  invokerAddress: string;
  timestamp: number;
  txHash: string;
  status: 'success' | 'failure';
  metadata?: {
    temperature?: number; // for report_temperature
    amount?: bigint; // for deposit/release/slash
  };
}

/** Parameters for initializing a new shipment */
export interface InitializeShipmentParams {
  shipper: string;
  usdcToken: string;
  minTemp: number;
  maxTemp: number;
  logisticsProvider: string;
  oracle: string;
  bondAmount: bigint;
}

/** A temperature reading with zone and trend classification */
export interface TemperatureReading {
  value: number; // centidegrees
  zone: TemperatureZone;
  trend: 'up' | 'down' | 'stable';
  timestamp: number;
}

// --- Component Prop Interfaces ---

/** Props for the ShipmentPipeline component */
export interface ShipmentPipelineProps {
  currentState: ShipmentStatus;
  lastTransitionTimestamp?: number;
  animated?: boolean;
}

/** Props for the TemperatureGauge component */
export interface TemperatureGaugeProps {
  currentTemp: number; // centidegrees
  previousTemp?: number; // for trend indicator
  minThreshold: number; // centidegrees
  maxThreshold: number; // centidegrees
}

/** Props for the BondStatusCard component */
export interface BondStatusCardProps {
  amount: bigint; // USDC in stroops
  status: BondStatus;
  contractAddress: string;
  recipientAddress?: string;
  lastChangeTimestamp?: number;
}

/** Props for the TransactionHistory component */
export interface TransactionHistoryProps {
  transactions: TransactionEntry[];
  network: StellarNetwork;
}

/** Props for the RoleSwitcher component */
export interface RoleSwitcherProps {
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

/** Props for the NetworkSelector component */
export interface NetworkSelectorProps {
  activeNetwork: StellarNetwork;
  onNetworkChange: (network: StellarNetwork) => void;
  isTransactionPending: boolean;
}

/** Props for the CreateShipmentForm component */
export interface CreateShipmentFormProps {
  connectedAddress: string;
  onSubmit: (params: InitializeShipmentParams) => Promise<void>;
}
