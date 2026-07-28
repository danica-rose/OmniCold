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
- [Level 1 Requirements](#level-1-requirements)
- [Level 2 Requirements](#level-2-requirements)
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

## Level 1 Requirements

> **White Belt** — Your project must include all items below to successfully complete Level 1.

### 1. Wallet Setup

- Set up the Freighter wallet
- Use Stellar Testnet

### 2. Wallet Connection

- Implement wallet connect functionality
- Implement wallet disconnect functionality

### 3. Balance Handling

- Fetch the connected wallet's XLM balance
- Display the balance clearly in the UI

### 4. Transaction Flow

- Send an XLM transaction on the Stellar testnet
- Show transaction feedback to the user:
  - Success or failure state
  - Transaction hash or confirmation message

### 5. Development Standards

Examples: UI setup, wallet integration, balance fetch, transaction logic, error handling

### 💭 Level 1 Project Ideas

Choose one of the following beginner-friendly ideas or propose your own (as long as all requirements are met):

- **Simple Payment dApp** — Send XLM to any address with amount input
- **Wallet Balance Checker** — Display balance for multiple accounts
- **Transaction History Viewer** — Show recent transactions for the connected wallet
- **Testnet Faucet Interface** — Request testnet XLM with one click
- **Tip Jar Page** — Static donation page with QR code
- **Split Bill Calculator** — Calculate split and send payment

---

## Level 2 Requirements

> **Green Belt** — Building on your White Belt skills, you will now integrate multiple wallets, deploy your first smart contract, and implement real-time event handling.

**Focus**: Multi-wallet integration, smart contract deployment, and real-time data synchronization

**By completing this level, you will learn:**

- StellarWalletsKit implementation
- Error handling (wallet not found, rejected, insufficient balance)
- Deploying a contract to the testnet
- Calling contract functions from the frontend
- Reading and writing data to a contract
- Event listening and state synchronization
- Transaction status tracking (pending/success/fail)

> 💰 At the end of the monthly review period, selected winners will receive a prize based on the quality of their submission, and each winner will receive $10.

### Requirements

Your project must include all items below to successfully complete Level 2:

- 3 error types handled
- Contract deployed on testnet
- Contract called from the frontend
- Transaction status visible
- Minimum 2+ meaningful commits

**Deliverable**: Multi-wallet app with deployed contract and real-time event integration

### 💭 Level 2 Project Ideas

Choose one of these projects or propose your own (as long as it meets the requirements):

- **Token Swap Interface** — Basic swap UI using Stellar DEX orderbook
- **NFT Minter** — Mint simple NFT with metadata and live status
- **Crowdfunding Page** — Collect donations with real-time progress
- **Real-time Auction** — Live bidding with event updates
- **Token Leaderboard** — Track and display token holders in real-time
- **Activity Feed** — Stream contract events as notifications
- **Live Poll** — One-question poll with real-time results
- **Payment Tracker** — Multi-address payments with status updates

---

## Submission Checklist

Ensure your project meets all requirements before submitting:

- [ ] Public GitHub repository
- [ ] README with setup instructions
- [ ] Minimum 2+ meaningful commits
- [ ] Live demo link (deployed on Vercel, Netlify, or similar) *(Optional)*
- [ ] Screenshot: wallet options available
- [ ] Deployed contract address
- [ ] Transaction hash of a contract call (verifiable on Stellar Explorer)

> Submit your GitHub repository link before the monthly deadline. You can submit anytime during the month. Earlier submissions will be reviewed first.

---

## License

MIT
