# OmniCold

IoT-integrated escrow dApp on Stellar/Soroban for cold-chain logistics. The smart contract holds USDC bonds deposited by logistics providers and automatically slashes them when an authorized IoT oracle reports a temperature threshold breach during cargo transit.

---

## Table of Contents

- [Live Deployment](#live-deployment)
- [Problem](#problem)
- [Solution](#solution)
- [Architecture](#architecture)
- [Contract Entry Points](#contract-entry-points)
- [Shipment Lifecycle](#shipment-lifecycle)
- [Currency Support](#currency-support)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Features](#features)
- [Testing](#testing)
- [Level 1 Compliance](#level-1-compliance)
- [Level 2 Compliance](#level-2-compliance)
- [Submission Checklist](#submission-checklist)
- [License](#license)

---

## Live Deployment

- **Contract ID**: `CCM2F2EHUAYPDW4FB2OUZOVD3ZOHPBFT5CTZ73GFA6OZCWDED6SFVRMW`
- **Network**: Stellar Testnet
- **Explorer**: [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCM2F2EHUAYPDW4FB2OUZOVD3ZOHPBFT5CTZ73GFA6OZCWDED6SFVRMW)

## Problem

Cold-chain logistics for pharmaceuticals and biologics face critical accountability gaps:

| Issue | Impact |
|-------|--------|
| **Delayed compensation** | Shippers wait weeks/months for claims to resolve when temperature breaches occur |
| **Disputed sensor data** | No immutable record — logistics providers can contest readings with no audit trail |
| **Manual arbitration** | Expensive third-party dispute resolution with unpredictable outcomes |
| **No financial consequence** | Providers face no immediate penalty for violating temperature SLAs |
| **Opaque custody** | Bond funds sit in traditional bank accounts controlled by intermediaries |

The result: $35B+ in pharmaceutical waste annually due to cold-chain failures, with no trustless mechanism to enforce accountability.

## Solution

OmniCold eliminates every point of failure with on-chain automation:

| Problem | OmniCold Solution |
|---------|------------------|
| Delayed compensation | **Instant slashing** — bond transfers to shipper in the same transaction as breach detection (~5s) |
| Disputed sensor data | **Immutable on-chain records** — every temperature reading is a Stellar transaction, permanently auditable |
| Manual arbitration | **Zero human intervention** — the smart contract enforces rules autonomously, no appeals process |
| No financial consequence | **USDC bond at risk** — logistics providers lock real money that gets slashed on violation |
| Opaque custody | **Trustless escrow** — funds held by Soroban contract code, not by any company or person |

**How it works in practice:**
1. Shipper creates a shipment with temperature bounds (e.g., 2°C–8°C for vaccines)
2. Logistics provider deposits a USDC bond as guarantee
3. IoT sensors report temperatures on-chain via an authorized oracle address
4. If any reading exceeds thresholds → bond is atomically slashed to the shipper
5. If delivery completes within range → bond is released back to the provider

No intermediary. No delay. No dispute. Just code.

## Architecture

OmniCold uses a **single-shipment contract** model — each deployed instance manages exactly one shipment.

| Component | Technology |
|-----------|-----------|
| Smart Contract | Rust + Soroban SDK 22.0.0 |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Wallet | Freighter (Stellar browser extension) |
| Token | USDC (Stellar Asset Contract) |
| Animations | Framer Motion |
| State | Zustand |
| Testing | Vitest + fast-check (PBT) |

## Contract Entry Points

| Function | Caller | Action |
|----------|--------|--------|
| `initialize_shipment` | Shipper | Creates shipment with temp thresholds and participants |
| `deposit_bond` | Logistics Provider | Deposits USDC bond, activates shipment |
| `report_temperature` | Oracle | Reports reading; slashes bond if out of range |
| `confirm_delivery` | Shipper | Releases bond back to logistics provider |

## Shipment Lifecycle

```
Created ──[deposit_bond]──> Active ──[confirm_delivery]──> Delivered (bond → LP)
                                   ──[breach detected]───> Breached  (bond → Shipper)
```

## Currency Support

- **Bond currency**: USDC (on-chain)
- **Display currencies**: USDC, XLM, PHP (Philippine Peso)
- **Live conversion**: Rates fetched from CoinGecko API with 60s cache
- **XLM balance**: Shown in wallet dropdown with USD/PHP equivalents

## Project Structure

```
omnicold/
├── contracts/omnicold/          # Soroban smart contract (Rust)
│   ├── src/lib.rs              # Contract implementation
│   └── src/test.rs             # 12 tests (5 unit + 7 PBT)
├── frontend/                    # Next.js 16 dashboard
│   ├── app/                    # Pages (landing, dashboard views)
│   ├── components/             # React components
│   │   ├── icons/              # SVG icon library (24 icons)
│   │   ├── layout/            # NavHeader, WalletButton, RoleSwitcher
│   │   ├── shipment/          # Pipeline, Gauge, BondCard, TxHistory
│   │   ├── forms/             # CreateShipment, TemperatureInput
│   │   ├── shared/            # FrostCard, Toast, Skeleton, etc.
│   │   └── landing/           # Hero, Aurora, RoleCards
│   ├── stores/                 # Zustand (wallet, contract, UI)
│   ├── services/               # Soroban RPC, Freighter, Prices, Polling
│   ├── hooks/                  # useWallet, useContractState, usePrices, etc.
│   └── lib/                    # Types, utils, constants, animations
├── scripts/deploy.sh            # Stellar CLI deployment
└── README.md
```

## Prerequisites

- [Rust toolchain](https://rustup.rs/) (for contract)
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://soroban.stellar.org/docs/getting-started/setup): `cargo install --locked stellar-cli`
- [Node.js](https://nodejs.org/) 18+ (for frontend)
- [Freighter Wallet](https://www.freighter.app/) browser extension

## Quick Start

### Smart Contract

```bash
cd contracts/omnicold

# Build
cargo build --target wasm32-unknown-unknown --release

# Test (12 tests, all passing)
cargo test

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/omnicold.wasm \
  --network testnet \
  --source <YOUR_IDENTITY>
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Set contract ID (already configured for testnet)
# Edit .env.local if needed

# Run development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) and connect your Freighter wallet.

## Features

- **Arctic dark theme** with frosted-glass effects and ice-themed animations
- **Role-based dashboard**: Shipper, Provider, Oracle views
- **270° temperature gauge** with SVG rendering and spring-physics needle
- **Shipment pipeline** with animated state transitions
- **Real-time XLM balance** with USD/PHP conversion
- **Bond status card** with USDC/XLM/PHP display
- **FAQ section** and detailed landing page
- **Responsive design** (mobile/tablet/desktop)
- **WCAG 2.1 AA** accessibility compliant
- **Reduced motion** support for accessibility

## Testing

- **Contract**: 5 unit tests + 7 property-based tests (Rust)
- **Frontend**: 9 property-based tests (fast-check) + integration tests

---

## Level 1 Compliance

> How OmniCold fulfills each White Belt requirement.

| Requirement | Implementation |
|-------------|---------------|
| **Wallet Setup** — Freighter + Testnet | Freighter API integrated via `@stellar/freighter-api`. Network hardcoded to Stellar Testnet in `stores/walletStore.ts` |
| **Wallet Connect** | `connect()` in walletStore calls `freighter.requestAccess()` and stores the public key. WalletButton in NavHeader triggers it |
| **Wallet Disconnect** | `disconnect()` clears address, balance, and connection state. Accessible from the wallet dropdown |
| **Fetch XLM Balance** | `fetchBalance()` queries the Horizon `/accounts/{address}` endpoint and extracts the native balance |
| **Display Balance in UI** | XLM balance shown in the NavHeader wallet dropdown with live USD/PHP conversion via CoinGecko |
| **Send Transaction on Testnet** | `SorobanService.submitTransaction()` sends signed XDR to Soroban RPC. Used for bond deposits, breach reports, and delivery confirmation |
| **Transaction Feedback** | Toast notifications show success/failure. Transaction hash displayed in the TxHistory component and linkable to Stellar Explorer |
| **Development Standards** | TypeScript strict mode, component-based architecture, Zustand state management, Vitest + fast-check testing, Tailwind CSS styling |

---

## Level 2 Compliance

> How OmniCold fulfills each Green Belt requirement.

| Requirement | Implementation |
|-------------|---------------|
| **3+ Error Types Handled** | 9 contract errors mapped in `lib/errors.ts` (already initialized, unauthorized oracle, invalid state, transfer failure, etc.). Frontend catches wallet-not-found, user-rejected, and insufficient-balance errors in `services/freighter.ts` |
| **Contract Deployed on Testnet** | Deployed at `CCM2F2EHUAYPDW4FB2OUZOVD3ZOHPBFT5CTZ73GFA6OZCWDED6SFVRMW` — [view on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCM2F2EHUAYPDW4FB2OUZOVD3ZOHPBFT5CTZ73GFA6OZCWDED6SFVRMW) |
| **Contract Called from Frontend** | `SorobanService` builds transaction XDR for `initialize_shipment`, `deposit_bond`, `report_temperature`, and `confirm_delivery`, signs via Freighter, submits to RPC |
| **Transaction Status Visible** | `contractStore.isTransactionPending` tracks pending state. `pollTransactionStatus()` polls RPC up to 10 times (2s intervals) reporting pending → success/fail. Toast + TxHistory show final status |
| **2+ Meaningful Commits** | ✅ Multiple feature commits across contract, frontend, and testing |
| **Real-time Event Integration** | `services/polling.ts` polls contract state on interval. State changes trigger UI re-renders via Zustand subscriptions |

---

## Submission Checklist

| Item | Status |
|------|--------|
| Public GitHub repository | ✅ |
| README with setup instructions | ✅ (see [Quick Start](#quick-start)) |
| 2+ meaningful commits | ✅ |
| Live demo link | [omni-cold.vercel.app](https://omni-cold.vercel.app) |
| Screenshot: wallet options | *(see below)* |
| Deployed contract address | `CCM2F2EHUAYPDW4FB2OUZOVD3ZOHPBFT5CTZ73GFA6OZCWDED6SFVRMW` |
| Transaction hash | *(add after first contract call on testnet)* |

> Submit your GitHub repository link before the monthly deadline.

---

## License

MIT
