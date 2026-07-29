# OmniCold

IoT-integrated escrow dApp on Stellar/Soroban for cold-chain logistics. The smart contract holds USDC bonds deposited by logistics providers and automatically slashes them when an authorized IoT oracle reports a temperature threshold breach during cargo transit.

---

## Table of Contents

- [Live Deployment](#live-deployment)
- [Wallet Integration](#wallet-integration)
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
- [Idea Submission](#idea-submission)
- [Submission Checklist](#submission-checklist)
- [License](#license)

---

## Live Deployment

- **Contract ID**: `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO`
- **Network**: Stellar Testnet
- **Explorer**: [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO)
- **Deploy TX**: [View on StellarExpert](https://stellar.expert/explorer/testnet/tx/a0c17f7a92c42553615ac4514ebcb1cf764e243bf645bef27c3438a64adcd437)

## Wallet Integration

> Full details: [WALLET_INTEGRATION.md](./WALLET_INTEGRATION.md)

| Feature | Implementation | File |
|---------|---------------|------|
| **Wallet Library** | `@stellar/freighter-api` v2.0.0 | `frontend/package.json` |
| **Connect Wallet** | `freighter.requestAccess()` → stores public key | `frontend/stores/walletStore.ts` |
| **Disconnect Wallet** | Clears address, balance, connection state | `frontend/stores/walletStore.ts` |
| **Sign Transaction** | `freighter.signTransaction(xdr, {networkPassphrase})` | `frontend/services/freighter.ts` |
| **Get Address** | `freighter.requestAccess()` returns G... address | `frontend/services/freighter.ts` |
| **Detect Wallet** | `freighter.isConnected()` checks extension | `frontend/services/freighter.ts` |
| **XLM Balance** | Fetched from Horizon `/accounts/{address}` | `frontend/stores/walletStore.ts` |
| **Connect UI** | WalletButton component in NavHeader | `frontend/components/layout/WalletButton.tsx` |
| **TX Submission** | Build XDR → Sign → Submit to Soroban RPC | `frontend/stores/contractStore.ts` |

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
| **Contract Deployed on Testnet** | Deployed at `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` — [view on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) |
| **Contract Called from Frontend** | `SorobanService` builds transaction XDR for `initialize_shipment`, `deposit_bond`, `report_temperature`, and `confirm_delivery`, signs via Freighter, submits to RPC |
| **Transaction Status Visible** | `contractStore.isTransactionPending` tracks pending state. `pollTransactionStatus()` polls RPC up to 10 times (2s intervals) reporting pending → success/fail. Toast + TxHistory show final status |
| **2+ Meaningful Commits** | ✅ Multiple feature commits across contract, frontend, and testing |
| **Real-time Event Integration** | `services/polling.ts` polls contract state on interval. State changes trigger UI re-renders via Zustand subscriptions |

---

## Idea Submission

### 1. Problem Statement

Cold-chain logistics for pharmaceuticals and biologics lacks trustless, automated penalty enforcement when temperature thresholds are breached during transit. The current dispute resolution process relies on manual claims, delayed arbitration, and opaque sensor data stored in centralized databases controlled by the logistics provider.

This creates three critical failures:
- **Delayed compensation** — shippers wait weeks or months for claims to resolve
- **Disputed sensor readings** — no immutable audit trail means providers can contest data
- **No immediate financial consequence** — providers face zero automated penalty for violating temperature SLAs

The pharmaceutical industry loses over $35 billion annually to cold-chain failures, yet the enforcement mechanism remains manual and trust-dependent.

### 2. Why Stellar?

Stellar is uniquely suited for this use case:

- **Native USDC**: Circle-issued USDC on Stellar via the Stellar Asset Contract (SAC). Bonds are real dollars, not volatile tokens. Cold-chain logistics operates in fiat — USDC bridges that gap without conversion friction.
- **5-second finality**: When a temperature breach occurs, the bond slash executes in the same block (~5s). No waiting for confirmations. Breach → penalty is near-instant.
- **Sub-cent fees**: IoT oracles report temperatures frequently. At ~$0.0001/tx, monitoring a 48-hour shipment every 15 minutes costs less than $0.02 total. On Ethereum this would cost hundreds in gas.
- **Soroban smart contracts**: Rust-based, WASM-compiled contracts provide the conditional logic for escrow, threshold evaluation, and atomic token transfers.
- **Enterprise credibility**: Stellar is used by MoneyGram, Circle, and Wise for real-money movement. Pharmaceutical companies need institutional-grade infrastructure, not DeFi-focused chains.

### 3. Target Users

| User | Role | Incentive |
|------|------|-----------|
| **Pharmaceutical Distributors** | Shipper — creates shipments, defines temp thresholds | Guaranteed instant compensation on breach without filing claims |
| **Cold-Chain Logistics Providers** | Provider — deposits USDC bond as SLA guarantee | Competitive differentiation: posting a bond signals confidence in cold-chain capability |
| **IoT Oracle Operators** | Oracle — authorized address reporting temperatures on-chain | Recurring revenue from oracle services; reputation tied to reporting accuracy |
| **Cargo Insurers** | Observer — monitors on-chain data | Transparent penalty enforcement reduces dispute volume and claims processing costs |

### 4. Technical Architecture

**Frontend**: Next.js 16 + TypeScript + Tailwind CSS, deployed on Vercel (serverless). Wallet via Freighter, state via Zustand, contract interaction via `@stellar/stellar-sdk` v12.

**Smart Contract**: Rust + `soroban-sdk` 22.0.0, compiled to WASM. Four entry points: `initialize_shipment`, `deposit_bond`, `report_temperature`, `confirm_delivery`. All state in Soroban persistent storage with TTL bumping.

**Data Flow**:

```
IoT Sensor → Oracle Wallet → report_temperature() → Contract evaluates threshold
                                                          │
                                              [In range]  → State stays Active
                                              [Out of range] → Atomic slash:
                                                   USDC from contract → Shipper
                                                   State → Breached (irreversible)
```

No backend, no database. The blockchain is the single source of truth. Frontend reads state via Soroban RPC, mutations happen through signed transactions.

### 5. Complexity Evaluation

What makes OmniCold technically challenging:

1. **Atomic multi-party token transfers** — The contract must atomically move USDC between three parties (provider → escrow → shipper) with proper authorization. Failed mid-execution transfers could lock funds permanently.

2. **Irreversible state machine** — Shipment lifecycle (Created → Active → Delivered/Breached) enforced on-chain with no rollback. Access control must prevent race conditions between oracle breach reports and shipper delivery confirmations.

3. **IoT-to-blockchain oracle problem** — Real-world sensor data must be trustworthy on-chain. The system relies on a single authorized oracle address, requiring careful threat modeling around oracle compromise and downtime.

4. **Soroban TTL management** — Persistent storage entries expire if TTL is not bumped. The contract must extend TTL on all 8 storage keys during every interaction to prevent data loss mid-shipment.

5. **i128 arithmetic in WASM** — USDC bond amounts use 128-bit integers. Overflow-safe arithmetic on WASM targets requires different patterns than standard Rust.

6. **XDR type marshalling** — Frontend must serialize/deserialize between TypeScript and Soroban's XDR encoding (enum variants as ScvVec, addresses as ScAddress, i128 as split hi/lo).

### 6. Roadmap

**MVP (Current — Testnet)**:
- ✅ Single-shipment escrow contract deployed on Stellar Testnet
- ✅ Full lifecycle: create → deposit → monitor → deliver/breach
- ✅ Freighter wallet with connect/disconnect and XLM balance
- ✅ Role-based dashboard (Shipper, Provider, Oracle)
- ✅ Temperature gauge, shipment pipeline, transaction history
- ✅ 12 passing tests (5 unit + 7 property-based)
- ✅ Deployed on Vercel

**User Acquisition**:
- Open-source on GitHub, publish on Stellar Developer Discord
- Pilot with a small pharmaceutical distributor and regional cold-chain carrier
- Partner with IoT sensor manufacturers (Sensitech, Testo) for standardized oracle reporting

**Mainnet Vision**:
- Multi-shipment factory contract for concurrent shipments
- Multi-oracle consensus (2-of-3 agreement before triggering breach)
- Graduated penalty tiers (proportional to breach severity/duration)
- Cross-border settlement via Stellar anchor network
- Mobile oracle app connecting Bluetooth sensors directly to on-chain reporting

---

## Submission Checklist

| Item | Status |
|------|--------|
| Public GitHub repository | ✅ |
| README with setup instructions | ✅ (see [Quick Start](#quick-start)) |
| 2+ meaningful commits | ✅ |
| Live demo link | [omni-cold.vercel.app](https://omni-cold.vercel.app) |
| Screenshot: wallet options | *(see below)* |
| Deployed contract address | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| Transaction hash | *(add after first contract call on testnet)* |

> Submit your GitHub repository link before the monthly deadline.

---

## License

MIT
