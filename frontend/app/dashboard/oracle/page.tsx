'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

import { useContractStore } from '@/stores/contractStore';
import { useWalletStore } from '@/stores/walletStore';

import { ShipmentPipeline } from '@/components/shipment/ShipmentPipeline';
import { TemperatureGauge } from '@/components/shipment/TemperatureGauge';
import { TransactionHistory } from '@/components/shipment/TransactionHistory';
import { TemperatureInputForm } from '@/components/forms/TemperatureInputForm';
import { SkeletonLoader, showToast } from '@/components/shared';
import { FrostCard } from '@/components/shared/FrostCard';
import { centidegreesToDisplay } from '@/lib/utils';
import { NETWORK_CONFIG } from '@/lib/constants';
import type { ContractState } from '@/lib/types';
import { frostThaw } from '@/lib/animations';
import { CheckCircleIcon, XIcon, PauseIcon } from '@/components/icons';

// ─── Demo / placeholder contract state ────────────────────────────────────────

const DEMO_CONTRACT_STATE: ContractState = {
  shipmentStatus: 'Active',
  minTemp: 200,
  maxTemp: 800,
  shipper: 'GDEMO_SHIPPER_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
  logisticsProvider: 'GDEMO_PROVIDER_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
  oracle: 'GDEMO_ORACLE_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAAAAAA',
  bondAmount: 1_000_000_000n,
  usdcToken: 'GDEMO_USDC_TOKEN_ADDRESS_PLACEHOLDER_AAAAAAAAAAAAAAAAAAAAAA',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OracleSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading oracle data..." role="status">
      <SkeletonLoader height="60px" />
      <SkeletonLoader height="40px" width="200px" />
      <SkeletonLoader height="260px" />
      <SkeletonLoader height="160px" />
      <SkeletonLoader height="80px" />
      <SkeletonLoader height="220px" />
    </div>
  );
}

// ─── Authorization badge ──────────────────────────────────────────────────────

interface AuthBadgeProps {
  isAuthorized: boolean;
}

function AuthBadge({ isAuthorized }: AuthBadgeProps) {
  return (
    <div
      className={[
        'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold',
        isAuthorized
          ? 'border-status-safe/60 bg-status-safe/10 text-status-safe'
          : 'border-status-breach/60 bg-status-breach/10 text-status-breach',
      ].join(' ')}
      role="status"
      aria-label={isAuthorized ? 'You are the authorized Oracle' : 'Not authorized as Oracle'}
    >
      <span aria-hidden="true">
        {isAuthorized
          ? <CheckCircleIcon size={16} className="text-status-safe" />
          : <XIcon size={16} className="text-status-breach" />
        }
      </span>
      {isAuthorized ? 'Authorized Oracle' : 'Not Authorized'}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * OracleView — Oracle operator dashboard.
 *
 * Sections:
 *  1. Header "Oracle Dashboard"
 *  2. Authorization badge (authorized / not authorized)
 *  3. TemperatureGauge (active reading or demo)
 *  4. Temperature threshold labels
 *  5. TemperatureInputForm
 *  6. ShipmentPipeline
 *  7. TransactionHistory
 */
export default function OracleView() {
  const { contractState, isLoading, transactions, submitTransaction, fetchContractState } =
    useContractStore();
  const { address, network } = useWalletStore();

  const state = contractState ?? DEMO_CONTRACT_STATE;

  const isAuthorized = address != null && state.oracle === address;
  const isActive = state.shipmentStatus === 'Active';

  useEffect(() => {
    fetchContractState();
  }, [fetchContractState]);

  // ── Handler ──────────────────────────────────────────────────────────────────

  async function handleReportTemperature(temperature: number) {
    await submitTransaction('report_temperature', { oracle: address, temperature });
    await fetchContractState();

    // After re-fetch, if now Breached, the pipeline will update automatically
    const updated = useContractStore.getState().contractState;
    if (updated?.shipmentStatus === 'Breached') {
      showToast('error', 'Temperature breach detected! Bond has been slashed.');
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6">
        <OracleSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-6 p-4 md:p-6"
      initial={frostThaw.initial}
      animate={frostThaw.animate}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-frost-white tracking-tight">Oracle Dashboard</h1>
        <AuthBadge isAuthorized={isAuthorized} />
      </div>

      {/* ── Wallet mismatch warning ──────────────────────────────────── */}
      {!isAuthorized && state.oracle && (
        <div className="flex items-start gap-3 rounded-xl border border-status-warning/40 bg-status-warning/5 px-5 py-4" role="alert">
          <span className="text-lg" aria-hidden="true">⚠️</span>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-status-warning">Wrong wallet connected</p>
            <p className="text-xs text-frost-gray">
              Switch to the Oracle wallet in Freighter to report temperatures.
            </p>
            <p className="text-xs text-frost-gray/70 font-mono mt-1">
              Expected: {state.oracle.slice(0, 8)}…{state.oracle.slice(-4)}
            </p>
          </div>
        </div>
      )}      {/* ── Temperature Gauge + Thresholds ───────────────────────────── */}
      <FrostCard className="p-5 flex flex-col items-center gap-4">
        <TemperatureGauge
          currentTemp={500}
          minThreshold={state.minTemp}
          maxThreshold={state.maxTemp}
        />

        {/* Threshold labels */}
        <div
          className="flex items-center gap-4 text-sm font-mono font-medium text-frost-gray"
          aria-label={`Temperature thresholds: Min ${centidegreesToDisplay(state.minTemp)}°C, Max ${centidegreesToDisplay(state.maxTemp)}°C`}
        >
          <span>
            Min:{' '}
            <span className="text-status-warning">{centidegreesToDisplay(state.minTemp)}°C</span>
          </span>
          <span className="text-frost-gray/40">|</span>
          <span>
            Max:{' '}
            <span className="text-status-warning">{centidegreesToDisplay(state.maxTemp)}°C</span>
          </span>
        </div>
      </FrostCard>

      {/* ── Temperature Input Form ───────────────────────────────────── */}
      <FrostCard className="p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-frost-gray mb-4">
          Report Reading
        </h2>
        <TemperatureInputForm onSubmit={handleReportTemperature} isActive={isActive} />
      </FrostCard>

      {/* ── Shipment Pipeline ───────────────────────────────────────── */}
      <FrostCard className="p-5">
        <ShipmentPipeline currentState={state.shipmentStatus} />
      </FrostCard>

      {/* ── Transaction History ─────────────────────────────────────── */}
      <FrostCard className="p-5">
        <TransactionHistory transactions={transactions} network={network} />
      </FrostCard>
    </motion.div>
  );
}
