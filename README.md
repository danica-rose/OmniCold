# ❄️ OmniCold

> IoT-integrated escrow dApp on Stellar/Soroban for cold-chain logistics. Automated penalty enforcement with zero human intervention.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://omni-cold.vercel.app)
[![Rust](https://img.shields.io/badge/Rust-Soroban-orange?logo=rust)](./contracts/omnicold/src/lib.rs)
[![Tests](https://img.shields.io/badge/Tests-22%20passing-green)](./contracts/omnicold/src/test.rs)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## Table of Contents

- [🚀 Live Deployment](#live-deployment)
- [👛 Wallet Integration](#wallet-integration)
- [Problem](#problem)
- [Solution](#solution)
- [🏗️ Architecture](#architecture)
- [Contract Entry Points](#contract-entry-points)
- [Shipment Lifecycle](#shipment-lifecycle)
- [Currency Support](#currency-support)
- [📁 Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [✨ Features](#features)
- [📸 Screenshots](#screenshots)
- [🌐 Deployed Contract](#deployed-contract)
- [🧪 Testing](#testing)
- [Level 1 Compliance](#level-1-compliance)
- [Level 2 Compliance](#level-2-compliance)
- [Level 3 Compliance](#level-3-compliance)
- [💡 Idea Submission](#idea-submission)
- [📝 Submission Checklist](#submission-checklist)
- [License](#license)

---

## 🚀 Live Deployment

| | |
|---|---|
| **Contract ID** | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| **Network** | Stellar Testnet |
| **Explorer** | [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) |
| **Deploy TX** | [View on StellarExpert](https://stellar.expert/explorer/testnet/tx/a0c17f7a92c42553615ac4514ebcb1cf764e243bf645bef27c3438a64adcd437) |
| **Live App** | [omni-cold.vercel.app](https://omni-cold.vercel.app) |

---

## 👛 Wallet Integration

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

---

## Problem

Cold-chain logistics for pharmaceuticals face critical accountability gaps:

| Issue | Impact |
|-------|--------|
| **Delayed compensation** | Shippers wait weeks/months for claims to resolve |
| **Disputed sensor data** | No immutable record — providers contest readings |
| **Manual arbitration** | Expensive third-party dispute resolution |
| **No financial consequence** | No immediate penalty for violating SLAs |
| **Opaque custody** | Bond funds in accounts controlled by intermediaries |

> **$35B+** in pharmaceutical waste annually from cold-chain failures.

---

## Solution

| Traditional | OmniCold |
|-------------|----------|
| Weeks to resolve claims | ~5 second penalty enforcement |
| Disputed sensor readings | Immutable on-chain audit trail |
| Expensive arbitration | Zero human intervention needed |
| No financial consequence | Real USDC bond at stake |
| Opaque fund custody | Trustless smart contract escrow |

**How it works:**
1. Shipper creates shipment with temperature bounds (e.g., 2°C–8°C)
2. Logistics provider deposits USDC bond as guarantee
3. IoT sensors report temperatures on-chain via authorized oracle
4. Breach detected → bond atomically slashed to shipper
5. Delivery confirmed → bond released back to provider

---

## 🏗️ Architecture

| Component | Technology |
|-----------|-----------|
| Smart Contract | Rust + Soroban SDK 22.0.0 |
| Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| Wallet | Freighter (Stellar browser extension) |
| Token | USDC (Stellar Asset Contract) |
| Animations | Framer Motion |
| State | Zustand + localStorage persist |
| Testing | Vitest + fast-check (PBT) |

---

## Contract Entry Points

| Function | Caller | Action |
|----------|--------|--------|
| `initialize_shipment` | Shipper | Creates shipment with temp thresholds and participants |
| `deposit_bond` | Provider | Deposits USDC bond, activates shipment |
| `report_temperature` | Oracle | Reports reading; slashes bond if out of range |
| `confirm_delivery` | Shipper | Releases bond back to logistics provider |
| `get_shipment` | Anyone | Read shipment data by ID |
| `get_shipment_count` | Anyone | Get total number of shipments |

---

## Shipment Lifecycle

```
Created ──[deposit_bond]──► Active ──[confirm_delivery]──► Delivered (bond → Provider)
                                   ──[breach detected]───► Breached  (bond → Shipper)
```

---

## Currency Support

| Currency | Usage |
|----------|-------|
| USDC | Bond deposits and slashing (on-chain) |
| XLM | Native balance display, gas fees |
| PHP | Philippine Peso conversion display |

Live rates from CoinGecko API with 60s cache.

---

## 📁 Project Structure

```
omnicold/
├── contracts/omnicold/          # Soroban smart contract (Rust)
│   ├── src/lib.rs              # Multi-shipment contract
│   └── src/test.rs             # 12 tests
├── frontend/                    # Next.js 16 dashboard
│   ├── app/                    # Pages (landing, dashboard views)
│   ├── components/             # React components
│   ├── stores/                 # Zustand (wallet, contract, UI)
│   ├── services/               # Soroban RPC, Freighter, Prices
│   ├── hooks/                  # useWallet, useContractState, usePrices
│   └── lib/                    # Types, utils, constants
├── .github/workflows/ci.yml    # CI/CD pipeline
├── demo/                        # HTML presentation (12 slides)
├── WALLET_INTEGRATION.md        # Wallet integration docs
├── scripts/deploy.sh            # Stellar CLI deployment
└── README.md
```

---

## Prerequisites

- [Rust toolchain](https://rustup.rs/)
- `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- [Stellar CLI](https://soroban.stellar.org/docs/getting-started/setup): `cargo install --locked stellar-cli`
- [Node.js](https://nodejs.org/) 18+
- [Freighter Wallet](https://www.freighter.app/) browser extension

---

## Quick Start

### Smart Contract

```bash
cd contracts/omnicold

# Build
stellar contract build

# Test (12 tests)
cargo test

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/omnicold.wasm \
  --network testnet \
  --source <YOUR_IDENTITY>
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # development server
npm test       # run tests (10 tests)
```

Open [http://localhost:3000](http://localhost:3000) and connect your Freighter wallet.

---

## ✨ Features

- Arctic dark theme with frosted-glass effects
- Role-based dashboard (Shipper, Provider, Oracle)
- 270° temperature gauge with spring-physics needle
- Shipment pipeline with animated state transitions
- Real-time XLM balance with USD/PHP conversion
- Bond status card with multi-currency display
- FAQ section and landing page
- Mobile responsive (hamburger nav, fluid grids)
- WCAG 2.1 AA accessible
- Reduced motion support
- Toast notifications for transaction feedback
- Persistent state via localStorage

---

## 📸 Screenshots

### 1. Landing Page

![Landing Page](./docs/screenshots/landing-page.png)

> The landing page introduces OmniCold with an animated aurora background, a clear value proposition ("IoT-integrated escrow for cold-chain logistics"), trust signals (USDC bond, ~5s slash latency, zero human arbitration), and a prominent "Launch App" CTA that triggers Freighter wallet connection.

---

### 2. Wallet Connection

![Wallet Connection](./docs/screenshots/wallet-connect.png)

> Clicking "Launch App" or "Connect Wallet" triggers the Freighter browser extension popup. The user approves the connection, and their Stellar public key (G...) is stored in the app. The XLM balance is fetched from Horizon and displayed in the navigation header.

---

### 3. Shipper Dashboard — Create Shipment

![Create Shipment](./docs/screenshots/create-shipment.png)

> The Shipper dashboard allows creating new shipments by specifying temperature thresholds (in centidegrees), logistics provider address, oracle address, USDC token address (pre-filled for demo), and bond amount in USDC. Live conversion to XLM and stroops is shown below the bond field.

---

### 4. Provider Dashboard — Deposit Bond

![Provider Dashboard](./docs/screenshots/provider-dashboard.png)

> After switching to the Provider role and connecting with the logistics provider wallet, the Provider Dashboard shows pending bond deposits with shipment details (shipper, temp range, oracle, bond required). Clicking "Deposit Bond" signs and submits the transaction to activate the shipment.

---

### 5. Oracle Dashboard — Report Temperature

![Oracle Dashboard](./docs/screenshots/oracle-dashboard.png)

> The Oracle Dashboard displays the temperature gauge (270° SVG arc), current thresholds, and an input form for reporting readings. If the oracle reports a temperature outside the safe range, the contract automatically transitions to "Breached" state.

---

### 6. Shipment Pipeline — State Transitions

![Shipment Pipeline](./docs/screenshots/shipment-pipeline.png)

> The animated shipment pipeline shows the current lifecycle state (Created → Active → Delivered/Breached). Each state transition is triggered by an on-chain transaction and reflected in real-time via the Zustand store.

---

### 7. Transaction History

![Transaction History](./docs/screenshots/tx-history.png)

> Every contract interaction is logged in the Transaction History component with type (initialize, deposit, report, confirm), invoker address, timestamp, status (success/failure), and a clickable transaction hash linking to Stellar Explorer.

---

### 8. Mobile Responsive UI

![Mobile View](./docs/screenshots/mobile-responsive.png)

> The entire app is mobile responsive using Tailwind CSS breakpoints. Navigation collapses to a hamburger menu, cards stack vertically, and all touch targets meet the 44px minimum WCAG requirement.

---

## 🌐 Deployed Contract

- **OmniCold Soroban contract (Stellar Testnet):**

  `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` · [view on Stellar Expert ↗](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO)

![Stellar Expert Contract](./docs/screenshots/stellar-expert.png)

> The contract is deployed on Stellar Testnet and verifiable on Stellar Expert. The contract page shows the WASM hash, creation date, data storage entries, and a full history of all transactions (initialize_shipment, deposit_bond, report_temperature, confirm_delivery).

- **Live web app:** [omni-cold.vercel.app](https://omni-cold.vercel.app)

Every initialization, bond deposit, temperature report, and delivery confirmation can be verified independently on Stellar Expert — the contract itself is the source of truth.

---

## 🧪 Testing

| Type | Count | Framework |
|------|-------|-----------|
| Contract unit tests | 12 | `soroban_sdk::testutils` |
| Frontend tests | 10 | Vitest + fast-check |
| **Total** | **22** | All passing |

---

## Level 1 Compliance

> How OmniCold fulfills each White Belt requirement.

| Requirement | Implementation |
|-------------|---------------|
| **Wallet Setup** | `@stellar/freighter-api` integrated, Stellar Testnet (`stores/walletStore.ts`) |
| **Wallet Connect** | `connect()` calls `freighter.requestAccess()`, stores public key |
| **Wallet Disconnect** | `disconnect()` clears address, balance, connection state |
| **Fetch XLM Balance** | `fetchBalance()` queries Horizon `/accounts/{address}` |
| **Display Balance** | XLM shown in NavHeader wallet dropdown with USD/PHP conversion |
| **Send Transaction** | `SorobanService.submitTransaction()` sends signed XDR to Soroban RPC |
| **Transaction Feedback** | Toast notifications + TX hash in TxHistory component |
| **Dev Standards** | TypeScript strict, Zustand, Vitest + fast-check, Tailwind CSS |

---

## Level 2 Compliance

> How OmniCold fulfills each Green Belt requirement.

| Requirement | Implementation |
|-------------|---------------|
| **3+ Error Types** | 9 contract errors mapped. Frontend catches wallet-not-found, user-rejected, insufficient-balance |
| **Contract Deployed** | [`CCE3VM3W...ECRAO`](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) on Testnet |
| **Contract Called from Frontend** | `SorobanService` builds XDR → signs via Freighter → submits to RPC |
| **Transaction Status Visible** | `isTransactionPending` + polling + Toast + TxHistory |
| **2+ Meaningful Commits** | Multiple feature commits across contract, frontend, testing |
| **Real-time Integration** | Polling service + Zustand subscriptions + auto-refresh |

---

## Level 3 Compliance

> How OmniCold fulfills each Black Belt requirement.

| Requirement | Implementation |
|-------------|---------------|
| **Advanced Smart Contract** | Multi-shipment factory pattern, counter-based IDs, struct storage, event emission, TTL management |
| **Inter-Contract Communication** | Contract interacts with USDC SAC token contract via `token::Client` for bond transfers |
| **Event Streaming & Real-time** | Contract emits events (`shipment_created`, `bond_deposited`, `breach_detected`, `delivery_confirmed`). Frontend polls via `PollingService` with tab-visibility awareness |
| **CI/CD Pipeline** | GitHub Actions (`.github/workflows/ci.yml`) — contract tests + frontend type-check + frontend tests on push/PR |
| **Contract Deployment Workflow** | `stellar contract build` + `stellar contract deploy`. WASM optimized to 6.9KB |
| **Mobile Responsive** | Tailwind responsive breakpoints, hamburger nav, fluid grids, 44px min touch targets |
| **Error Handling & Loading** | 9 error codes → user-friendly messages. SkeletonLoader components. Loading/pending states. Toast notifications |
| **Tests (3+ passing)** | **22 total** — 12 contract tests + 10 frontend tests, all passing |
| **Production-Ready Architecture** | TypeScript strict, Zustand persist, service layer pattern, env configs, error boundaries |
| **Documentation & Demo** | README, WALLET_INTEGRATION.md, JSDoc/Rustdoc, 12-slide HTML demo |

### Test Results

**Contract (12/12 passing):**
```
test test::test_happy_path_full_lifecycle ............. ok
test test::test_unauthorized_oracle_rejected .......... ok
test test::test_breach_detected_state_transition ...... ok
test test::test_duplicate_report_after_breach_rejected  ok
test test::test_initialization_validation ............. ok
test test::test_multiple_shipments .................... ok
test test::test_wrong_provider_cannot_deposit ......... ok
test test::test_wrong_shipper_cannot_confirm .......... ok
test test::test_shipment_not_found .................... ok
test test::test_cold_breach ........................... ok
test test::test_cannot_confirm_after_breach ........... ok
test test::test_get_shipment_data ..................... ok
```

**Frontend (10/10 passing):**
```
Test Files  1 passed (1)
     Tests  10 passed (10)
```

### CI/CD Pipeline

File: `.github/workflows/ci.yml`

| Job | What it does |
|-----|-------------|
| Contract Build & Test | `cargo test` + WASM build |
| Frontend Build & Test | `tsc --noEmit` + `npm test` |
| Deploy to Vercel | Auto-deploys on main after tests pass |

### Level 3 Submission Checklist

| Item | Status |
|------|--------|
| Public GitHub repository | ✅ |
| README with complete documentation | ✅ |
| 10+ meaningful commits | ✅ |
| Live demo link | [omni-cold.vercel.app](https://omni-cold.vercel.app) |
| Contract deployment address | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| Transaction hash | [View](https://stellar.expert/explorer/testnet/tx/a0c17f7a92c42553615ac4514ebcb1cf764e243bf645bef27c3438a64adcd437) |
| Mobile responsive UI | ✅ Tailwind responsive + hamburger nav |
| CI/CD pipeline running | ✅ `.github/workflows/ci.yml` |
| 3+ passing tests | ✅ 22 tests (12 contract + 10 frontend) |
| Demo video | [HTML Demo](./demo/index.html) |

---

## 💡 Idea Submission

### 1. Problem Statement

Cold-chain logistics lacks trustless, automated penalty enforcement when temperature thresholds are breached. Current process: manual claims, delayed arbitration, opaque sensor data.

- Shippers wait weeks/months for compensation
- No immutable audit trail — providers contest data
- Zero automated penalty for SLA violations
- **$35B+** annual pharmaceutical waste from cold-chain failures

### 2. Why Stellar?

| Feature | Benefit |
|---------|---------|
| Native USDC | Real dollars, not volatile tokens. Circle-issued. |
| 5-second finality | Breach → slash in one block |
| Sub-cent fees | ~$0.0001/tx. Monitor 48hr shipment for <$0.02 |
| Soroban contracts | Rust + WASM. Deterministic, auditable |
| Enterprise network | MoneyGram, Circle, Wise use Stellar |

### 3. Target Users

| User | Role | Incentive |
|------|------|-----------|
| Pharmaceutical Distributors | Shipper | Instant compensation on breach |
| Cold-Chain Providers | Provider | Competitive differentiation via bond |
| IoT Oracle Operators | Oracle | Recurring revenue from services |
| Cargo Insurers | Observer | Reduced claims processing costs |

### 4. Technical Architecture

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  Next.js App │────►│  Soroban RPC   │────►│  Stellar     │
│  (Vercel)    │◄────│  (Testnet)     │◄────│  Validators  │
└──────────────┘     └────────────────┘     └──────────────┘
       │                                           │
       ▼                                           ▼
┌──────────────┐                           ┌──────────────┐
│  Freighter   │                           │  OmniCold    │
│  Wallet      │                           │  Contract    │
└──────────────┘                           └──────────────┘
```

### 5. Complexity Evaluation

1. Atomic multi-party token transfers
2. Irreversible state machine with access control
3. IoT-to-blockchain oracle problem
4. Soroban TTL management
5. i128 arithmetic in WASM
6. XDR type marshalling (TS ↔ Soroban)

### 6. Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| MVP | ✅ Complete | Multi-shipment contract, dashboard, Freighter, Vercel |
| Pilot | Next | Partner with pharma distributor for testnet pilot |
| Multi-Oracle | Planned | 2-of-3 consensus before breach trigger |
| Mainnet | Planned | Real USDC, graduated penalties, cross-border |

---

## 📝 Submission Checklist

| Item | Status |
|------|--------|
| Public GitHub repository | ✅ |
| README with setup instructions | ✅ |
| 10+ meaningful commits | ✅ |
| Live demo link | [omni-cold.vercel.app](https://omni-cold.vercel.app) |
| Contract address | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| Transaction hash | [View](https://stellar.expert/explorer/testnet/tx/a0c17f7a92c42553615ac4514ebcb1cf764e243bf645bef27c3438a64adcd437) |

---

## License

MIT
