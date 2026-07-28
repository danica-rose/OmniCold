'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { useContractStore } from '@/stores/contractStore';
import { useWalletStore } from '@/stores/walletStore';

import { ShipmentPipeline } from '@/components/shipment/ShipmentPipeline';
import { TemperatureGauge } from '@/components/shipment/TemperatureGauge';
import { BondStatusCard } from '@/components/shipment/BondStatusCard';
import { TransactionHistory } from '@/components/shipment/TransactionHistory';
import { ContractInfoPanel } from '@/components/shared/ContractInfoPanel';
import { LoadingButton, SkeletonLoader, showToast } from '@/components/shared';
import { FrostCard } from '@/components/shared/FrostCard';
import { formatUsdcAmount, truncateAddress, centidegreesToDisplay } from '@/lib/utils';
import { NETWORK_CONFIG } from '@/lib/constants';
import type { ContractState } from '@/lib/types';
import { frostThaw } from '@/lib/animations';
import { TruckIcon, CoinsIcon } from '@/components/icons';

// ─── Demo / placeholder contract state ────────────────────────────────────────

const DEMO_CONTRACT_STATE: ContractState = {
  shipmentStatus: 'Created',
  minTemp: 200,
  maxTemp: 800,
  shipper: 'GDEMO_SHIPPER_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
  logisticsProvider: 'GDEMO_PROVIDER_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
  oracle: 'GDEMO_ORACLE_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAAAAAA',
  bondAmount: 1_000_000_000n,
  usdcToken: 'GDEMO_USDC_TOKEN_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ProviderSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading provider data..." role="status">
      <SkeletonLoader height="60px" />
      <SkeletonLoader height="140px" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonLoader height="200px" />
        <SkeletonLoader height="200px" />
      </div>
      <SkeletonLoader height="220px" />
    </div>
  );
}

// ─── Pending shipment card ────────────────────────────────────────────────────

interface PendingShipmentCardProps {
  state: ContractState;
  onDeposit: () => Promise<void>;
  isDepositing: boolean;
}

function PendingShipmentCard({ state, onDeposit, isDepositing }: PendingShipmentCardProps) {
  return (
    <FrostCard className="p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-frost-gray">
        Pending Bond Deposit
      </h2>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoRow label="Shipper" value={truncateAddress(state.shipper)} mono />
        <InfoRow
          label="Temp Range"
          value={`${centidegreesToDisplay(state.minTemp)}°C — ${centidegreesToDisplay(state.maxTemp)}°C`}
          mono
        />
        <InfoRow
          label="Bond Required"
          value={`${formatUsdcAmount(state.bondAmount)} USDC`}
          mono
        />
        <InfoRow label="Oracle" value={truncateAddress(state.oracle)} mono />
      </dl>

      <LoadingButton
        variant="primary"
        isLoading={isDepositing}
        onClick={onDeposit}
        className="w-full sm:w-auto"
      >
        <CoinsIcon size={16} className="inline-block mr-1" aria-hidden="true" /> Deposit Bond — {formatUsdcAmount(state.bondAmount)} USDC
      </LoadingButton>
    </FrostCard>
  );
}

// ─── Info row helper ──────────────────────────────────────────────────────────

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-frost-gray">{label}</dt>
      <dd className={`text-sm text-frost-white ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ProviderView — Logistics Provider dashboard.
 *
 * Sections:
 *  - Empty state (no active shipment for this wallet)
 *  - Pending section (Created): shipper details, temp thresholds, bond, "Deposit Bond" button
 *  - Active section: ShipmentPipeline, TemperatureGauge, BondStatusCard (held)
 *  - Terminal section (Delivered/Breached): pipeline + bond card
 *  - ContractInfoPanel
 *  - TransactionHistory
 */
export default function ProviderView() {
  const { contractState, isLoading, transactions, submitTransaction, fetchContractState } =
    useContractStore();
  const { address, network } = useWalletStore();

  const [isDepositing, setIsDepositing] = useState(false);

  const state = contractState ?? DEMO_CONTRACT_STATE;
  const contractAddress = NETWORK_CONFIG[network].contractId;

  // Whether this wallet is the designated provider
  const isProvider = address != null && state.logisticsProvider === address;
  const hasShipment = contractState !== null;

  useEffect(() => {
    fetchContractState();
  }, [fetchContractState]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleDepositBond() {
    setIsDepositing(true);
    try {
      await submitTransaction('deposit_bond', { logisticsProvider: address });
      await fetchContractState();
      showToast('success', 'Bond deposited! Shipment is now Active.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bond deposit failed';
      showToast('error', message);
    } finally {
      setIsDepositing(false);
    }
  }

  // ── Bond status derivation ───────────────────────────────────────────────────

  function getBondStatus() {
    if (state.shipmentStatus === 'Delivered') return 'released';
    if (state.shipmentStatus === 'Breached') return 'slashed';
    return 'held';
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6">
        <ProviderSkeleton />
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (!hasShipment || !isProvider) {
    return (
      <motion.div
        className="flex flex-col gap-6 p-4 md:p-6"
        initial={frostThaw.initial}
        animate={frostThaw.animate}
      >
        <h1 className="text-xl font-bold text-frost-white tracking-tight">Provider Dashboard</h1>
        <FrostCard className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="bg-frost-cyan/10 rounded-full p-3">
            <TruckIcon size={32} className="text-frost-gray/40" aria-hidden="true" />
          </div>
          <p className="text-sm text-frost-gray">
            No shipments awaiting your action.
          </p>
          <p className="text-xs text-frost-gray/60">
            You will see pending and active shipments here once a Shipper designates your address.
          </p>
        </FrostCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6 p-4 md:p-6"
      initial={frostThaw.initial}
      animate={frostThaw.animate}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <h1 className="text-xl font-bold text-frost-white tracking-tight">Provider Dashboard</h1>

      {/* ── Pending (Created) section ────────────────────────────────── */}
      {state.shipmentStatus === 'Created' && (
        <PendingShipmentCard
          state={state}
          onDeposit={handleDepositBond}
          isDepositing={isDepositing}
        />
      )}

      {/* ── Active section ──────────────────────────────────────────── */}
      {state.shipmentStatus === 'Active' && (
        <>
          <FrostCard className="p-5">
            <ShipmentPipeline currentState="Active" />
          </FrostCard>

          <FrostCard className="p-5 flex flex-col items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-frost-gray self-start">
              Live Temperature
            </h2>
            <TemperatureGauge
              currentTemp={500}
              minThreshold={state.minTemp}
              maxThreshold={state.maxTemp}
            />
          </FrostCard>

          <BondStatusCard
            amount={state.bondAmount}
            status="held"
            contractAddress={contractAddress}
          />
        </>
      )}

      {/* ── Terminal section (Delivered / Breached) ──────────────────── */}
      {(state.shipmentStatus === 'Delivered' || state.shipmentStatus === 'Breached') && (
        <>
          <FrostCard className="p-5">
            <ShipmentPipeline currentState={state.shipmentStatus} />
          </FrostCard>

          <BondStatusCard
            amount={state.bondAmount}
            status={getBondStatus()}
            contractAddress={contractAddress}
          />
        </>
      )}

      {/* ── Contract Info Panel ─────────────────────────────────────── */}
      <ContractInfoPanel
        contractState={state}
        contractAddress={contractAddress}
        network={network}
      />

      {/* ── Transaction History ─────────────────────────────────────── */}
      <FrostCard className="p-5">
        <TransactionHistory transactions={transactions} network={network} />
      </FrostCard>
    </motion.div>
  );
}
