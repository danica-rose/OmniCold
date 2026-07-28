'use client';

import { ContractState, StellarNetwork } from '@/lib/types';
import { centidegreesToDisplay, formatUsdcAmount } from '@/lib/utils';
import { FrostCard } from './FrostCard';
import { TruncatedAddress } from './TruncatedAddress';
import { PackageIcon, TruckIcon, RadioIcon } from '@/components/icons';

interface ContractInfoPanelProps {
  contractState: ContractState;
  contractAddress: string;
  network: StellarNetwork;
}

/** Color mapping for each ShipmentStatus */
const statusColorMap: Record<string, string> = {
  Created: 'text-frost-cyan',
  Active: 'text-frost-cyan',
  Delivered: 'text-status-safe',
  Breached: 'text-status-breach',
};

/** Dot color mapping for status indicator */
const statusDotMap: Record<string, string> = {
  Created: 'bg-frost-cyan',
  Active: 'bg-frost-cyan',
  Delivered: 'bg-status-safe',
  Breached: 'bg-status-breach',
};

/**
 * Displays contract status at a glance: address, state, thresholds,
 * bond amount, network badge, and participant addresses with role icons.
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4
 */
export function ContractInfoPanel({
  contractState,
  contractAddress,
  network,
}: ContractInfoPanelProps) {
  const {
    shipmentStatus,
    minTemp,
    maxTemp,
    bondAmount,
    shipper,
    logisticsProvider,
    oracle,
  } = contractState;

  return (
    <FrostCard className="p-5 space-y-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-frost-gray uppercase tracking-wide border-b border-frost-cyan/10 pb-3 mb-4">
        Contract Info
      </h3>

      {/* Contract Address */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-frost-gray">Contract</span>
        <div className="flex items-center gap-2">
          <TruncatedAddress address={contractAddress} />
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-frost-cyan/60 hover:text-frost-cyan transition-colors"
            title="View on StellarExpert"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      </div>

      {/* Shipment State with color indicator */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-frost-gray">Status</span>
        <span className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${statusDotMap[shipmentStatus]}`}
          />
          <span className={`text-sm font-medium ${statusColorMap[shipmentStatus]}`}>
            {shipmentStatus}
          </span>
        </span>
      </div>

      {/* Temperature Thresholds */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-frost-gray">Temp Range</span>
        <span className="text-sm text-frost-white font-mono">
          {centidegreesToDisplay(minTemp)}°C — {centidegreesToDisplay(maxTemp)}°C
        </span>
      </div>

      {/* Bond Amount */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-frost-gray">Bond</span>
        <span className="text-sm text-frost-white font-mono">
          {formatUsdcAmount(bondAmount)} USDC
        </span>
      </div>

      {/* Network Badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-frost-gray">Network</span>
        {network === 'testnet' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-frost-cyan/20 text-frost-cyan">
            TEST
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-status-safe/20 text-status-safe">
            LIVE
          </span>
        )}
      </div>

      {/* Divider */}
      <hr className="border-frost-cyan/10" />

      {/* Participants */}
      <div className="space-y-3">
        <h4 className="text-xs text-frost-gray uppercase tracking-wide">
          Participants
        </h4>

        {/* Shipper */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-frost-gray">
            <PackageIcon size={14} className="text-frost-gray" aria-hidden="true" />
            Shipper
          </span>
          <TruncatedAddress address={shipper} />
        </div>

        {/* Logistics Provider */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-frost-gray">
            <TruckIcon size={14} className="text-frost-gray" aria-hidden="true" />
            Provider
          </span>
          <TruncatedAddress address={logisticsProvider} />
        </div>

        {/* Oracle */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-frost-gray">
            <RadioIcon size={14} className="text-frost-gray" aria-hidden="true" />
            Oracle
          </span>
          <TruncatedAddress address={oracle} />
        </div>
      </div>
    </FrostCard>
  );
}

export default ContractInfoPanel;
