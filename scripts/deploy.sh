#!/bin/bash
set -euo pipefail

# =============================================================================
# OmniCold Escrow — Soroban Contract Deployment Script
# =============================================================================
#
# This script builds, deploys, and demonstrates invocation of the OmniCold
# escrow contract on the Stellar testnet using the Soroban CLI.
#
# Prerequisites:
#   - Rust toolchain with wasm32-unknown-unknown target installed
#   - Stellar CLI (soroban-cli) installed and configured
#   - A funded testnet account (SOURCE) with enough XLM for fees
#
# Environment Variables (required):
#   SOURCE              — Secret key or identity name of the deployer account
#   SHIPPER             — Stellar address of the pharmaceutical distributor
#   LOGISTICS_PROVIDER  — Stellar address of the cold-chain carrier
#   ORACLE              — Stellar address of the authorized IoT temperature sensor
#   USDC_TOKEN          — Contract address of USDC SAC on testnet
#
# Environment Variables (optional):
#   NETWORK             — Network to deploy to (default: testnet)
#   MIN_TEMP            — Minimum temperature threshold in centidegrees (default: 200 = 2.00°C)
#   MAX_TEMP            — Maximum temperature threshold in centidegrees (default: 800 = 8.00°C)
#   BOND_AMOUNT         — USDC bond amount in stroops (default: 10000000000 = 10,000 USDC)
#
# Usage:
#   export SOURCE="my-testnet-identity"
#   export SHIPPER="G..."
#   export LOGISTICS_PROVIDER="G..."
#   export ORACLE="G..."
#   export USDC_TOKEN="C..."
#   ./scripts/deploy.sh
# =============================================================================

# --- Configuration -----------------------------------------------------------

NETWORK="${NETWORK:-testnet}"
MIN_TEMP="${MIN_TEMP:-200}"
MAX_TEMP="${MAX_TEMP:-800}"
BOND_AMOUNT="${BOND_AMOUNT:-10000000000}"

echo "=== OmniCold Escrow Deployment ==="
echo "Network:             ${NETWORK}"
echo "Source:              ${SOURCE}"
echo "Shipper:             ${SHIPPER}"
echo "Logistics Provider:  ${LOGISTICS_PROVIDER}"
echo "Oracle:              ${ORACLE}"
echo "USDC Token:          ${USDC_TOKEN}"
echo "Min Temp:            ${MIN_TEMP} centidegrees"
echo "Max Temp:            ${MAX_TEMP} centidegrees"
echo "Bond Amount:         ${BOND_AMOUNT} stroops"
echo ""

# --- Step 1: Build the contract ----------------------------------------------
# Compiles the Soroban smart contract to WASM targeting wasm32-unknown-unknown.

echo ">>> Building contract..."
stellar contract build
echo "    Build complete."
echo ""

# --- Step 2: Deploy the contract to testnet ----------------------------------
# Deploys the compiled WASM binary and outputs the resulting contract ID.

echo ">>> Deploying contract to ${NETWORK}..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/omnicold.wasm \
  --network "${NETWORK}" \
  --source-account "${SOURCE}")

echo "    Contract deployed!"
echo "    Contract ID: ${CONTRACT_ID}"
echo ""

# --- Step 3: Initialize the shipment ----------------------------------------
# Creates a new shipment record with temperature thresholds, participant
# addresses, and bond amount. The SOURCE account acts as the shipper.

echo ">>> Initializing shipment..."
stellar contract invoke \
  --id "${CONTRACT_ID}" \
  --network "${NETWORK}" \
  --source-account "${SOURCE}" \
  -- \
  initialize_shipment \
  --shipper "${SHIPPER}" \
  --usdc_token "${USDC_TOKEN}" \
  --min_temp "${MIN_TEMP}" \
  --max_temp "${MAX_TEMP}" \
  --logistics_provider "${LOGISTICS_PROVIDER}" \
  --oracle "${ORACLE}" \
  --bond_amount "${BOND_AMOUNT}"

echo "    Shipment initialized. State: Created"
echo ""

# --- Step 4: Deposit bond (called by Logistics Provider) ---------------------
# The logistics provider deposits the USDC bond into the contract escrow.
# This transitions the shipment state from Created → Active.
# NOTE: This must be invoked with the LP's source account.

echo ">>> Depositing bond (must be called by Logistics Provider)..."
echo "    Example command:"
echo "    stellar contract invoke \\"
echo "      --id \"${CONTRACT_ID}\" \\"
echo "      --network \"${NETWORK}\" \\"
echo "      --source-account \"\${LP_SECRET}\" \\"
echo "      -- \\"
echo "      deposit_bond \\"
echo "      --logistics_provider \"${LOGISTICS_PROVIDER}\""
echo ""

# --- Step 5: Report temperature (called by Oracle) ---------------------------
# The IoT oracle reports a temperature reading. If the reading is within
# [min_temp, max_temp], the state remains Active. If out of range, the bond
# is atomically slashed (transferred to shipper) and state → Breached.
# NOTE: This must be invoked with the Oracle's source account.

echo ">>> Reporting temperature (must be called by Oracle)..."
echo "    Example command (in-range reading of 500 centidegrees = 5.00°C):"
echo "    stellar contract invoke \\"
echo "      --id \"${CONTRACT_ID}\" \\"
echo "      --network \"${NETWORK}\" \\"
echo "      --source-account \"\${ORACLE_SECRET}\" \\"
echo "      -- \\"
echo "      report_temperature \\"
echo "      --oracle \"${ORACLE}\" \\"
echo "      --temperature 500"
echo ""
echo "    Example command (out-of-range breach at 1200 centidegrees = 12.00°C):"
echo "    stellar contract invoke \\"
echo "      --id \"${CONTRACT_ID}\" \\"
echo "      --network \"${NETWORK}\" \\"
echo "      --source-account \"\${ORACLE_SECRET}\" \\"
echo "      -- \\"
echo "      report_temperature \\"
echo "      --oracle \"${ORACLE}\" \\"
echo "      --temperature 1200"
echo ""

# --- Step 6: Confirm delivery (called by Shipper) ----------------------------
# The shipper confirms successful delivery. The bond is released back to the
# logistics provider and the shipment state transitions Active → Delivered.
# NOTE: This must be invoked with the Shipper's source account.

echo ">>> Confirming delivery (must be called by Shipper)..."
echo "    Example command:"
echo "    stellar contract invoke \\"
echo "      --id \"${CONTRACT_ID}\" \\"
echo "      --network \"${NETWORK}\" \\"
echo "      --source-account \"\${SHIPPER_SECRET}\" \\"
echo "      -- \\"
echo "      confirm_delivery \\"
echo "      --shipper \"${SHIPPER}\""
echo ""

# --- Done --------------------------------------------------------------------

echo "=== Deployment complete ==="
echo "Contract ID: ${CONTRACT_ID}"
echo ""
echo "Next steps:"
echo "  1. Fund the Logistics Provider with USDC and call deposit_bond"
echo "  2. Have the Oracle report temperature readings via report_temperature"
echo "  3. Shipper calls confirm_delivery on successful transit (or breach auto-slashes)"
