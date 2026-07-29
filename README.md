# ❄️ OmniCold

> IoT-integrated escrow dApp on Stellar/Soroban for cold-chain logistics. Automated penalty enforcement with zero human intervention.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://omni-cold.vercel.app)
[![Rust](https://img.shields.io/badge/Rust-Soroban-orange?logo=rust)](./contracts/omnicold/src/lib.rs)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

---

## 📑 Table of Contents

- [🚀 Live Deployment](#-live-deployment)
- [👛 Wallet Integration](#-wallet-integration)
- [❗ Problem](#-problem)
- [✅ Solution](#-solution)
- [🏗️ Architecture](#️-architecture)
- [📋 Contract Entry Points](#-contract-entry-points)
- [🔄 Shipment Lifecycle](#-shipment-lifecycle)
- [💱 Currency Support](#-currency-support)
- [📁 Project Structure](#-project-structure)
- [⚙️ Prerequisites](#️-prerequisites)
- [🏃 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🧪 Testing](#-testing)
- [🥋 Level 1 Compliance](#-level-1-compliance)
- [🥋 Level 2 Compliance](#-level-2-compliance)
- [💡 Idea Submission](#-idea-submission)
- [📝 Submission Checklist](#-submission-checklist)
- [📄 License](#-license)

---

## 🚀 Live Deployment

| | |
|---|---|
| 🔗 **Contract ID** | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| 🌐 **Network** | Stellar Testnet |
| 🔍 **Explorer** | [View on StellarExpert](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) |
| 📤 **Deploy TX** | [View on StellarExpert](https://stellar.expert/explorer/testnet/tx/a0c17f7a92c42553615ac4514ebcb1cf764e243bf645bef27c3438a64adcd437) |
| 🌍 **Live App** | [omni-cold.vercel.app](https://omni-cold.vercel.app) |

---

## 👛 Wallet Integration

> 📄 Full details: [WALLET_INTEGRATION.md](./WALLET_INTEGRATION.md)

| Feature | Implementation | File |
|---------|---------------|------|
| 📦 **Wallet Library** | `@stellar/freighter-api` v2.0.0 | `frontend/package.json` |
| 🔌 **Connect Wallet** | `freighter.requestAccess()` → stores public key | `frontend/stores/walletStore.ts` |
| 🔓 **Disconnect Wallet** | Clears address, balance, connection state | `frontend/stores/walletStore.ts` |
| ✍️ **Sign Transaction** | `freighter.signTransaction(xdr, {networkPassphrase})` | `frontend/services/freighter.ts` |
| 🆔 **Get Address** | `freighter.requestAccess()` returns G... address | `frontend/services/freighter.ts` |
| 🔍 **Detect Wallet** | `freighter.isConnected()` checks extension | `frontend/services/freighter.ts` |
| 💰 **XLM Balance** | Fetched from Horizon `/accounts/{address}` | `frontend/stores/walletStore.ts` |
| 🖱️ **Connect UI** | WalletButton component in NavHeader | `frontend/components/layout/WalletButton.tsx` |
| 📡 **TX Submission** | Build XDR → Sign → Submit to Soroban RPC | `frontend/stores/contractStore.ts` |

---

## ❗ Problem

Cold-chain logistics for pharmaceuticals face critical accountability gaps:

| | Issue | Impact |
|---|-------|--------|
| ⏳ | **Delayed compensation** | Shippers wait weeks/months for claims to resolve |
| 🔒 | **Disputed sensor data** | No immutable record — providers contest readings |
| ⚖️ | **Manual arbitration** | Expensive third-party dispute resolution |
| 💸 | **No financial consequence** | No immediate penalty for violating SLAs |
| 👁️ | **Opaque custody** | Bond funds in accounts controlled by intermediaries |

> 💊 **$35B+** in pharmaceutical waste annually from cold-chain failures.

---

## ✅ Solution

| Traditional | OmniCold |
|-------------|----------|
| ❌ Weeks to resolve claims | ⚡ ~5 second penalty enforcement |
| ❌ Disputed sensor readings | 🔗 Immutable on-chain audit trail |
| ❌ Expensive arbitration | 🤖 Zero human intervention needed |
| ❌ No financial consequence | 💵 Real USDC bond at stake |
| ❌ Opaque fund custody | 🔐 Trustless smart contract escrow |

**How it works:**
1. 📦 Shipper creates shipment with temperature bounds (e.g., 2°C–8°C)
2. 💰 Logistics provider deposits USDC bond as guarantee
3. 🌡️ IoT sensors report temperatures on-chain via authorized oracle
4. ⚡ Breach detected → bond atomically slashed to shipper
5. ✅ Delivery confirmed → bond released back to provider

---

## 🏗️ Architecture

| Component | Technology |
|-----------|-----------|
| ⚙️ Smart Contract | Rust + Soroban SDK 22.0.0 |
| 🌐 Frontend | Next.js 16 + TypeScript + Tailwind CSS |
| 👛 Wallet | Freighter (Stellar browser extension) |
| 💵 Token | USDC (Stellar Asset Contract) |
| 🎨 Animations | Framer Motion |
| 📊 State | Zustand + localStorage persist |
| 🧪 Testing | Vitest + fast-check (PBT) |

---

## 📋 Contract Entry Points

| Function | Caller | Action |
|----------|--------|--------|
| `initialize_shipment` | 📦 Shipper | Creates shipment with temp thresholds and participants |
| `deposit_bond` | 🚛 Provider | Deposits USDC bond, activates shipment |
| `report_temperature` | 📡 Oracle | Reports reading; slashes bond if out of range |
| `confirm_delivery` | 📦 Shipper | Releases bond back to logistics provider |
| `get_shipment` | 🔍 Anyone | Read shipment data by ID |
| `get_shipment_count` | 🔍 Anyone | Get total number of shipments |

---

## 🔄 Shipment Lifecycle

```
📦 Created ──[deposit_bond]──► 🟢 Active ──[confirm_delivery]──► ✅ Delivered (bond → Provider)
                                          ──[breach detected]───► 🔴 Breached  (bond → Shipper)
```

---

## 💱 Currency Support

| | Currency | Usage |
|---|----------|-------|
| 💵 | USDC | Bond deposits and slashing (on-chain) |
| ⭐ | XLM | Native balance display, gas fees |
| 🇵🇭 | PHP | Philippine Peso conversion display |

Live rates from CoinGecko API with 60s cache.

---

## 📁 Project Structure

```
omnicold/
├── 📜 contracts/omnicold/       # Soroban smart contract (Rust)
│   ├── src/lib.rs              # Multi-shipment contract
│   └── src/test.rs             # 12 tests (5 unit + 7 PBT)
├── 🌐 frontend/                 # Next.js 16 dashboard
│   ├── app/                    # Pages (landing, dashboard views)
│   ├── components/             # React components
│   │   ├── icons/              # SVG icon library (24 icons)
│   │   ├── layout/            # NavHeader, WalletButton, RoleSwitcher
│   │   ├── shipment/          # Pipeline, Gauge, BondCard, TxHistory
│   │   ├── forms/             # CreateShipment, TemperatureInput
│   │   ├── shared/            # FrostCard, Toast, Skeleton
│   │   └── landing/           # Hero, Aurora, RoleCards
│   ├── stores/                 # Zustand (wallet, contract, UI)
│   ├── services/               # Soroban RPC, Freighter, Prices
│   ├── hooks/                  # useWallet, useContractState, usePrices
│   └── lib/                    # Types, utils, constants
├── 🎬 demo/                     # HTML presentation (12 slides)
├── 📝 WALLET_INTEGRATION.md     # Wallet integration documentation
├── 🚀 scripts/deploy.sh         # Stellar CLI deployment
└── 📖 README.md
```

---

## ⚙️ Prerequisites

- 🦀 [Rust toolchain](https://rustup.rs/)
- 🎯 `wasm32-unknown-unknown` target: `rustup target add wasm32-unknown-unknown`
- ⭐ [Stellar CLI](https://soroban.stellar.org/docs/getting-started/setup): `cargo install --locked stellar-cli`
- 📗 [Node.js](https://nodejs.org/) 18+
- 👛 [Freighter Wallet](https://www.freighter.app/) browser extension

---

## 🏃 Quick Start

### 📜 Smart Contract

```bash
cd contracts/omnicold

# Build
stellar contract build

# Test
cargo test

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32v1-none/release/omnicold.wasm \
  --network testnet \
  --source <YOUR_IDENTITY>
```

### 🌐 Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

Open [http://localhost:3000](http://localhost:3000) and connect your Freighter wallet.

---

## ✨ Features

| | Feature | Description |
|---|---------|-------------|
| 🎨 | Arctic dark theme | Frosted-glass effects and ice-themed animations |
| 👥 | Role-based dashboard | Shipper, Provider, Oracle views |
| 🌡️ | Temperature gauge | 270° SVG rendering with spring-physics needle |
| 🔄 | Shipment pipeline | Animated state transitions |
| 💰 | Real-time XLM balance | With USD/PHP conversion |
| 💎 | Bond status card | USDC/XLM/PHP display |
| ❓ | FAQ section | Detailed landing page |
| 📱 | Responsive design | Mobile/tablet/desktop |
| ♿ | WCAG 2.1 AA | Accessibility compliant |
| 🎭 | Reduced motion | Accessibility support |
| 🔔 | Toast notifications | Transaction feedback |
| 💾 | Persistent state | localStorage via Zustand |

---

## 🧪 Testing

| Type | Count | Framework |
|------|-------|-----------|
| 📜 Contract unit tests | 5 | `soroban_sdk::testutils` |
| 📜 Contract PBT | 7 | Property-based testing |
| 🌐 Frontend PBT | 9 | `fast-check` + Vitest |

---

## 🥋 Level 1 Compliance

> How OmniCold fulfills each **White Belt** requirement.

| Requirement | ✅ Implementation |
|-------------|------------------|
| 👛 **Wallet Setup** — Freighter + Testnet | `@stellar/freighter-api` integrated. Network = Stellar Testnet (`stores/walletStore.ts`) |
| 🔌 **Wallet Connect** | `connect()` calls `freighter.requestAccess()`, stores public key. WalletButton triggers it |
| 🔓 **Wallet Disconnect** | `disconnect()` clears address, balance, connection state |
| 💰 **Fetch XLM Balance** | `fetchBalance()` queries Horizon `/accounts/{address}` endpoint |
| 📊 **Display Balance in UI** | XLM shown in NavHeader wallet dropdown with USD/PHP conversion |
| 📡 **Send Transaction** | `SorobanService.submitTransaction()` sends signed XDR to Soroban RPC |
| 🔔 **Transaction Feedback** | Toast notifications (success/failure) + TX hash in TxHistory component |
| 🛠️ **Dev Standards** | TypeScript strict, Zustand state, Vitest + fast-check, Tailwind CSS |

---

## 🥋 Level 2 Compliance

> How OmniCold fulfills each **Green Belt** requirement.

| Requirement | ✅ Implementation |
|-------------|------------------|
| ⚠️ **3+ Error Types** | 9 contract errors in `lib/errors.ts`. Frontend catches wallet-not-found, user-rejected, insufficient-balance |
| 📜 **Contract Deployed** | [`CCE3VM3W...ECRAO`](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) on Testnet |
| 🔗 **Contract Called from Frontend** | `SorobanService` builds XDR → signs via Freighter → submits to RPC |
| 📊 **Transaction Status Visible** | `isTransactionPending` + `pollTransactionStatus()` + Toast + TxHistory |
| 📝 **2+ Meaningful Commits** | ✅ Multiple feature commits across contract, frontend, testing |
| 🔄 **Real-time Integration** | Polling service + Zustand subscriptions + auto-refresh after TX |

---

## 💡 Idea Submission

### 1. 🎯 Problem Statement

Cold-chain logistics lacks trustless, automated penalty enforcement when temperature thresholds are breached. Current process: manual claims → delayed arbitration → opaque sensor data.

- ⏳ Shippers wait weeks/months for compensation
- 🔒 No immutable audit trail — providers contest data
- 💸 Zero automated penalty for SLA violations
- 💊 **$35B+** annual pharmaceutical waste from cold-chain failures

### 2. ⭐ Why Stellar?

| Feature | Benefit |
|---------|---------|
| 💵 Native USDC | Real dollars, not volatile tokens. Circle-issued, production-grade |
| ⚡ 5-second finality | Breach → slash in one block. No waiting. |
| 💸 Sub-cent fees | ~$0.0001/tx. Monitor 48hr shipment for <$0.02 |
| 🦀 Soroban contracts | Rust + WASM. Deterministic, auditable logic |
| 🏢 Enterprise network | MoneyGram, Circle, Wise use Stellar |

### 3. 👥 Target Users

| User | Role | Incentive |
|------|------|-----------|
| 💊 Pharmaceutical Distributors | Shipper | Instant compensation on breach |
| 🚛 Cold-Chain Providers | Provider | Competitive differentiation via bond |
| 📡 IoT Oracle Operators | Oracle | Recurring revenue from services |
| 🏦 Cargo Insurers | Observer | Reduced claims processing costs |

### 4. 🏗️ Technical Architecture

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

**Data Flow**: IoT Sensor → Oracle Wallet → `report_temperature()` → Contract evaluates → Slash or Continue

### 5. 🧩 Complexity Evaluation

1. 🔄 **Atomic multi-party token transfers** — Failed mid-execution = locked funds
2. 🔒 **Irreversible state machine** — No rollback once breached
3. 📡 **IoT-to-blockchain oracle problem** — Single-point-of-failure threat modeling
4. ⏰ **Soroban TTL management** — Storage expires without bumping
5. 🔢 **i128 arithmetic in WASM** — Overflow-safe patterns
6. 📦 **XDR type marshalling** — TS ↔ Soroban serialization

### 6. 🗺️ Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 🟢 MVP | ✅ Complete | Multi-shipment contract, dashboard, Freighter, Vercel |
| 🟡 Pilot | 🔜 Next | Partner with pharma distributor for testnet pilot |
| 🟡 Multi-Oracle | 📋 Planned | 2-of-3 consensus before breach trigger |
| 🔴 Mainnet | 📋 Planned | Real USDC, graduated penalties, cross-border |

---

## 📝 Submission Checklist

| | Item | Status |
|---|------|--------|
| ✅ | Public GitHub repository | Done |
| ✅ | README with setup instructions | Done |
| ✅ | 2+ meaningful commits | Done |
| 🔗 | Live demo link | [omni-cold.vercel.app](https://omni-cold.vercel.app) |
| 📸 | Screenshot: wallet options | Available in app |
| 📜 | Deployed contract address | `CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO` |
| 🔗 | Transaction hash | Verifiable on [Stellar Explorer](https://stellar.expert/explorer/testnet/contract/CCE3VM3WBDDLBTH2ABYBBXN4XVKEMPQZQ5MI7S33TEIJMVDQMUVECRAO) |

---

## 📄 License

MIT
