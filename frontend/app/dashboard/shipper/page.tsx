'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useContractStore } from '@/stores/contractStore';
import { useWalletStore } from '@/stores/walletStore';

import { ShipmentPipeline } from '@/components/shipment/ShipmentPipeline';
import { TemperatureGauge } from '@/components/shipment/TemperatureGauge';
import { BondStatusCard } from '@/components/shipment/BondStatusCard';
import { TransactionHistory } from '@/components/shipment/TransactionHistory';
import { ContractInfoPanel } from '@/components/shared/ContractInfoPanel';
import { CreateShipmentForm } from '@/components/forms/CreateShipmentForm';
import { LoadingButton, SkeletonLoader, showToast } from '@/components/shared';
import { FrostCard } from '@/components/shared/FrostCard';
import { NETWORK_CONFIG } from '@/lib/constants';
import type { ContractState, InitializeShipmentParams } from '@/lib/types';
import { frostThaw } from '@/lib/animations';
import { AlertTriangleIcon } from '@/components/icons';

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

// ─── Skeleton placeholders ────────────────────────────────────────────────────

function ShipperSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-label="Loading shipment data..." role="status">
      <SkeletonLoader height="80px" />
      <SkeletonLoader height="120px" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonLoader height="200px" />
        <SkeletonLoader height="200px" />
      </div>
      <SkeletonLoader height="240px" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ShipperView — full Shipper dashboard.
 *
 * Sections (top → bottom):
 *  1. Header with "Create New Shipment" expand toggle
 *  2. Collapsible CreateShipmentForm
 *  3. ShipmentPipeline (current state)
 *  4. TemperatureGauge (Active state only, demo values)
 *  5. BondStatusCard
 *  6. Confirm Delivery button (Active state only)
 *  7. Breach alert banner (Breached state only)
 *  8. ContractInfoPanel
 *  9. TransactionHistory
 */
export default function ShipperView() {
  const { contractState, isLoading, transactions, submitTransaction, fetchContractState } =
    useContractStore();
  const { address, network } = useWalletStore();

  const [formOpen, setFormOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const state = contractState ?? DEMO_CONTRACT_STATE;
  const contractAddress = NETWORK_CONFIG[network].contractId;

  useEffect(() => {
    fetchContractState();
  }, [fetchContractState]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleInitializeShipment(params: InitializeShipmentParams) {
    showToast('success', 'Transaction signed! Submitting to Stellar testnet...');
    const txHash = await submitTransaction('initialize_shipment', params);
    if (txHash) {
      showToast('success', `Shipment created! TX: ${txHash.slice(0, 8)}…`);
    }
    await fetchContractState();
  }

  async function handleConfirmDelivery() {
    setIsConfirming(true);
    try {
      await submitTransaction('confirm_delivery', { shipper: address });
      await fetchContractState();
      showToast('success', 'Delivery confirmed! Bond released to provider.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Confirm delivery failed';
      showToast('error', message);
    } finally {
      setIsConfirming(false);
    }
  }

  // ── Determine bond status ────────────────────────────────────────────────────

  function getBondStatus() {
    if (state.shipmentStatus === 'Delivered') return 'released';
    if (state.shipmentStatus === 'Breached') return 'slashed';
    return 'held';
  }

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-6">
        <ShipperSkeleton />
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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold text-frost-white tracking-tight">
          Shipment Management
        </h1>
        <LoadingButton
          variant="primary"
          onClick={() => setFormOpen((v) => !v)}
          aria-expanded={formOpen}
          aria-controls="create-shipment-form"
        >
          {formOpen ? '✕ Close Form' : '+ Create New Shipment'}
        </LoadingButton>
      </div>

      {/* ── Create Shipment Form (collapsible) ───────────────────────── */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            id="create-shipment-form"
            key="create-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <FrostCard className="p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-frost-gray mb-4">
                New Shipment
              </h2>
              <CreateShipmentForm
                connectedAddress={address ?? ''}
                onSubmit={handleInitializeShipment}
              />
            </FrostCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Breach alert banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {state.shipmentStatus === 'Breached' && (
          <motion.div
            key="breach-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 rounded-xl border border-status-breach/60 bg-status-breach/10 px-5 py-4"
            role="alert"
            aria-live="assertive"
          >
            <span className="text-2xl" aria-hidden="true"><AlertTriangleIcon size={24} className="text-status-breach" /></span>
            <p className="text-sm font-semibold text-status-breach">
              Temperature Breach Detected!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shipment Pipeline ───────────────────────────────────────── */}
      <FrostCard className="p-5">
        <ShipmentPipeline currentState={state.shipmentStatus} />
      </FrostCard>

      {/* ── Active: Temperature Gauge ───────────────────────────────── */}
      {state.shipmentStatus === 'Active' && (
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
      )}

      {/* ── Bond Status Card + Confirm Delivery ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <BondStatusCard
          amount={state.bondAmount}
          status={getBondStatus()}
          contractAddress={contractAddress}
        />

        {/* Confirm Delivery button (Active only) */}
        {state.shipmentStatus === 'Active' && (
          <FrostCard className="p-5 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-frost-gray">
              Delivery
            </h2>
            <p className="text-xs text-frost-gray">
              Confirm delivery to release the bond back to the Logistics Provider.
            </p>
            <LoadingButton
              variant="success"
              isLoading={isConfirming}
              onClick={handleConfirmDelivery}
              className="w-full"
            >
              ✓ Confirm Delivery
            </LoadingButton>
          </FrostCard>
        )}
      </div>

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
