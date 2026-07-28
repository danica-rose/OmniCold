# Technical Stack — OmniCold Escrow dApp

## Blockchain Platform

- **Network**: Stellar (Soroban smart contracts)
- **Language**: Rust
- **SDK**: `soroban-sdk = "22.0.0"` (or newer stable)
- **Contract Type**: Soroban smart contract compiled to WASM

## Token

- **Asset**: USDC (Circle-issued stablecoin on Stellar)
- **Usage**: Real-money movement — bond deposits, penalty transfers, bond releases
- **Interface**: Stellar Asset Contract (SAC) or Soroban token interface (`token::Client`)

## Testing

- **Framework**: `soroban_sdk::testutils`
- **Required Scenarios** (exactly 5):
  1. Happy path — successful delivery, no breach, bond released
  2. Unauthorized reporter failure — non-oracle address attempts breach report
  3. State verification after breach — contract state transitions correctly
  4. Duplicate reporting protection — second breach report is rejected
  5. Initialization state validation — contract initializes with correct parameters

## Dependencies

```toml
[dependencies]
soroban-sdk = "22.0.0"

[dev-dependencies]
soroban-sdk = { version = "22.0.0", features = ["testutils"] }
```

## Key Technical Decisions

- IoT oracle is an authorized Stellar address (not an off-chain service)
- Temperature data is reported on-chain by the oracle address
- Bond slashing is an atomic USDC transfer from escrow to shipper
- Contract uses Soroban persistent storage for shipment state
- All state transitions are enforced by the contract (no admin override)
