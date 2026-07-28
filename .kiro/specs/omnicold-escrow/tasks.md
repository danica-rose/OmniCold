# Implementation Plan: OmniCold Escrow

## Overview

This plan implements the OmniCold Soroban smart contract — a single-shipment escrow that holds USDC bonds and enforces temperature-breach penalties atomically on-chain. Implementation proceeds from project scaffolding through core contract logic, entry points, unit tests, property-based tests, deployment scripts, and documentation.

## Tasks

- [x] 1. Project setup and workspace configuration
  - [x] 1.1 Create `contracts/omnicold/Cargo.toml` with Soroban dependencies
    - Add `soroban-sdk = "22.0.0"` under `[dependencies]`
    - Add `soroban-sdk = { version = "22.0.0", features = ["testutils"] }` under `[dev-dependencies]`
    - Add `proptest = "1"` under `[dev-dependencies]` for property-based tests
    - Set `crate-type = ["cdylib"]` and edition = "2021"
    - _Requirements: 9.1 (persistent storage infrastructure)_
    - _Design: Dependencies section_

  - [x] 1.2 Create directory structure and empty source files
    - Create `contracts/omnicold/src/lib.rs` (main contract module)
    - Create `contracts/omnicold/src/test.rs` (test module)
    - Create `scripts/` directory
    - _Requirements: 9.1_
    - _Design: Architecture section_

- [x] 2. Smart contract core — data types, storage, and error handling
  - [x] 2.1 Define `ShipmentStatus` enum, `StorageKey` enum, `ContractError` enum, and TTL constants in `contracts/omnicold/src/lib.rs`
    - Implement `ShipmentStatus` with `#[contracttype]`: Created, Active, Delivered, Breached
    - Implement `StorageKey` with `#[contracttype]` using PascalCase variants: ShipmentState, MinTemp, MaxTemp, Shipper, LogisticsProvider, Oracle, BondAmount, UsdcToken
    - Implement `ContractError` with `#[contracterror]` and `#[repr(u32)]`: AlreadyInitialized=1, InvalidTempRange=2, InvalidBondAmount=3, DuplicateParticipant=4, NotLogisticsProvider=5, NotOracle=6, NotShipper=7, InvalidState=8, TransferFailed=9
    - Define `LIFETIME_THRESHOLD: u32 = 17_280` and `BUMP_AMOUNT: u32 = 518_400`
    - _Requirements: 8.1, 8.6, 9.1, 9.2, 9.5_
    - _Design: Data Models section, Error Type section_

  - [x] 2.2 Define `OmniColdContract` struct with `#[contract]` attribute and empty `#[contractimpl]` block in `contracts/omnicold/src/lib.rs`
    - Add `use soroban_sdk::{contract, contractimpl, contracttype, contracterror, token, Address, Env}`
    - Add `#[cfg(test)] mod test;` at bottom of lib.rs
    - _Requirements: 9.1_
    - _Design: Contract Entry Points section_

- [x] 3. Implement `initialize_shipment` entry point
  - [x] 3.1 Implement `initialize_shipment` function in `contracts/omnicold/src/lib.rs`
    - Accept parameters: `env: Env`, `usdc_token: Address`, `min_temp: i32`, `max_temp: i32`, `logistics_provider: Address`, `oracle: Address`, `bond_amount: i128`
    - Guard against re-initialization: check `env.storage().persistent().has(&StorageKey::ShipmentState)` → return `AlreadyInitialized`
    - Validate `min_temp < max_temp` → return `InvalidTempRange`
    - Validate `bond_amount > 0` → return `InvalidBondAmount`
    - Validate LP and Oracle addresses differ from invoker (shipper) → return `DuplicateParticipant`
    - Store all fields to persistent storage using `StorageKey` enum
    - Set `ShipmentState` to `Created`
    - Extend TTL on all written keys
    - Return `Ok(())`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.6, 9.1, 9.2, 9.3, 9.5_
    - _Design: Components and Interfaces → initialize_shipment, Error Handling → Input Validation_

- [x] 4. Implement `deposit_bond` entry point
  - [x] 4.1 Implement `deposit_bond` function in `contracts/omnicold/src/lib.rs`
    - Read `LogisticsProvider` address from storage; call `require_auth()` on invoker
    - Verify invoker == stored LP → return `NotLogisticsProvider` if mismatch
    - Verify `ShipmentState` == Created → return `InvalidState` if not
    - Use `token::Client` to transfer `bond_amount` USDC from LP to contract address (`env.current_contract_address()`)
    - Transition `ShipmentState` from Created to Active
    - Extend TTL on all persistent keys
    - Return `Ok(())`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 7.1, 7.2, 8.1, 9.5_
    - _Design: Components and Interfaces → deposit_bond, Token Flow Diagram_

- [x] 5. Implement `report_temperature` entry point
  - [x] 5.1 Implement `report_temperature` function in `contracts/omnicold/src/lib.rs`
    - Read `Oracle` address from storage; call `require_auth()` on invoker
    - Verify invoker == stored Oracle → return `NotOracle` if mismatch
    - Verify `ShipmentState` == Active → return `InvalidState` if not
    - Read `MinTemp` and `MaxTemp` from storage
    - If `temperature >= min_temp && temperature <= max_temp`: extend TTL and return `Ok(())`
    - If out-of-range: use `token::Client` to transfer full `bond_amount` from contract to Shipper address, set state to `Breached`, extend TTL, return `Ok(())`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 6.3, 7.1, 7.3, 8.1, 8.4, 9.5_
    - _Design: Components and Interfaces → report_temperature, Correctness Properties 5 & 6_

- [x] 6. Implement `confirm_delivery` entry point
  - [x] 6.1 Implement `confirm_delivery` function in `contracts/omnicold/src/lib.rs`
    - Read `Shipper` address from storage; call `require_auth()` on invoker
    - Verify invoker == stored Shipper → return `NotShipper` if mismatch
    - Verify `ShipmentState` == Active → return `InvalidState` if not
    - Use `token::Client` to transfer full `bond_amount` from contract to LP address
    - Transition `ShipmentState` from Active to Delivered
    - Extend TTL on all persistent keys
    - Return `Ok(())`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.4, 8.1, 8.5, 9.5_
    - _Design: Components and Interfaces → confirm_delivery, Token Flow Diagram_

- [x] 7. Checkpoint — Core contract compiles
  - Ensure `cargo build --target wasm32-unknown-unknown --release` succeeds in `contracts/omnicold/`. Ask the user if questions arise.

- [x] 8. Unit test suite
  - [x] 8.1 Write test helpers and environment setup in `contracts/omnicold/src/test.rs`
    - Create helper function to register OmniCold contract, register mock USDC token (using `StellarAssetClient`), generate test addresses (shipper, LP, oracle, unauthorized), and mint USDC to LP
    - Import all required types from `super::*` and `soroban_sdk::testutils`
    - _Requirements: All (test infrastructure)_
    - _Design: Testing Strategy → Test Environment Setup_

  - [x] 8.2 Implement `test_happy_path` in `contracts/omnicold/src/test.rs`
    - Full lifecycle: initialize → deposit_bond → report in-range temperature → confirm_delivery
    - Assert state is Delivered, bond returned to LP, contract balance is zero
    - _Requirements: 1.1, 2.1, 2.2, 3.1, 5.1, 5.2, 8.1_
    - _Design: Testing Strategy → Scenario 1_

  - [x] 8.3 Implement `test_unauthorized_reporter` in `contracts/omnicold/src/test.rs`
    - Initialize and deposit bond (state = Active)
    - Call `report_temperature` from non-oracle address
    - Assert `NotOracle` error returned, state remains Active, no token transfer
    - _Requirements: 3.3, 7.3, 7.5_
    - _Design: Testing Strategy → Scenario 2_

  - [x] 8.4 Implement `test_state_after_breach` in `contracts/omnicold/src/test.rs`
    - Initialize and deposit bond (state = Active)
    - Report out-of-range temperature from oracle
    - Assert state is Breached, bond transferred to shipper
    - Attempt `confirm_delivery` → assert `InvalidState`
    - Attempt another `report_temperature` → assert `InvalidState`
    - _Requirements: 3.2, 4.1, 4.2, 4.3, 6.1, 8.4_
    - _Design: Testing Strategy → Scenario 3_

  - [x] 8.5 Implement `test_duplicate_report_protection` in `contracts/omnicold/src/test.rs`
    - Initialize, deposit bond, trigger breach with out-of-range reading
    - Call `report_temperature` again from oracle
    - Assert `InvalidState` error, no second transfer, state remains Breached
    - _Requirements: 6.1, 6.2, 6.3, 8.4_
    - _Design: Testing Strategy → Scenario 4_

  - [x] 8.6 Implement `test_initialization_state` in `contracts/omnicold/src/test.rs`
    - Call `initialize_shipment` with known parameters
    - Read all stored fields back and assert equality with inputs
    - Assert `ShipmentState` == Created
    - _Requirements: 1.1, 9.3_
    - _Design: Testing Strategy → Scenario 5_

- [x] 9. Checkpoint — All unit tests pass
  - Ensure `cargo test` passes in `contracts/omnicold/`. Ask the user if questions arise.

- [x] 10. Property-based tests
  - [x]* 10.1 Write property test for initialization round-trip in `contracts/omnicold/src/test.rs`
    - **Property 1: Initialization Storage Round-Trip**
    - Generate random valid params (i32 temps where min < max, distinct addresses, positive i128 bond)
    - Initialize, read back all fields, assert equality
    - Tag: `// Feature: omnicold-escrow, Property 1: Initialization Storage Round-Trip`
    - **Validates: Requirements 1.1, 9.3**

  - [x]* 10.2 Write property test for initialization input rejection in `contracts/omnicold/src/test.rs`
    - **Property 2: Initialization Rejects Invalid Inputs**
    - Generate random invalid param combinations (min >= max, bond <= 0, duplicate addresses)
    - Attempt initialization, assert error returned and no state persisted
    - Tag: `// Feature: omnicold-escrow, Property 2: Initialization Rejects Invalid Inputs`
    - **Validates: Requirements 1.2, 1.4, 1.5**

  - [x]* 10.3 Write property test for access control enforcement in `contracts/omnicold/src/test.rs`
    - **Property 3: Access Control Enforcement**
    - Generate random unauthorized addresses for each function
    - Invoke with wrong caller, assert error and no state/balance change
    - Tag: `// Feature: omnicold-escrow, Property 3: Access Control Enforcement`
    - **Validates: Requirements 2.3, 3.3, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5**

  - [x]* 10.4 Write property test for state machine integrity in `contracts/omnicold/src/test.rs`
    - **Property 4: State Machine Integrity**
    - For each ShipmentStatus, generate random function calls
    - Assert only legal transitions succeed; illegal ones fail with state unchanged
    - Tag: `// Feature: omnicold-escrow, Property 4: State Machine Integrity`
    - **Validates: Requirements 1.3, 2.4, 3.4, 5.4, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

  - [x]* 10.5 Write property test for in-range temperature preserving state in `contracts/omnicold/src/test.rs`
    - **Property 5: In-Range Temperature Preserves Active State**
    - Generate random threshold pairs and random in-range temperatures
    - Report, assert state remains Active and no token transfer
    - Tag: `// Feature: omnicold-escrow, Property 5: In-Range Temperature Preserves Active State`
    - **Validates: Requirements 3.1, 4.4**

  - [x]* 10.6 Write property test for out-of-range temperature triggering slash in `contracts/omnicold/src/test.rs`
    - **Property 6: Out-of-Range Temperature Triggers Atomic Slash**
    - Generate random thresholds and out-of-range temperatures
    - Report, assert state is Breached and bond transferred to shipper
    - Tag: `// Feature: omnicold-escrow, Property 6: Out-of-Range Temperature Triggers Atomic Slash`
    - **Validates: Requirements 3.2, 4.1, 4.2, 4.3**

  - [x]* 10.7 Write property test for delivery releasing bond in `contracts/omnicold/src/test.rs`
    - **Property 7: Delivery Confirmation Releases Full Bond to Logistics Provider**
    - Generate random active shipments with varying bond amounts
    - Confirm delivery, assert bond transferred to LP and state is Delivered
    - Tag: `// Feature: omnicold-escrow, Property 7: Delivery Confirmation Releases Full Bond to Logistics Provider`
    - **Validates: Requirements 5.1, 5.2**

- [x] 11. Checkpoint — All tests pass (unit + property)
  - Ensure `cargo test` passes with all property tests executing minimum 100 iterations. Ask the user if questions arise.

- [x] 12. Deployment scripts
  - [x] 12.1 Create `scripts/deploy.sh` with Soroban CLI commands
    - Include shebang and `set -euo pipefail`
    - Build contract: `soroban contract build`
    - Deploy contract: `soroban contract deploy --wasm target/wasm32-unknown-unknown/release/omnicold.wasm --network testnet`
    - Include example invocations for `initialize_shipment`, `deposit_bond`, `report_temperature`, `confirm_delivery`
    - Make script executable
    - _Requirements: All (deployment infrastructure)_
    - _Design: Architecture section (Stellar Network deployment)_

- [x] 13. Documentation
  - [x] 13.1 Create `README.md` with project overview, build instructions, and CLI commands
    - Project overview: purpose, architecture, single-shipment model
    - Prerequisites: Rust toolchain, `soroban-cli`, `wasm32-unknown-unknown` target
    - Build instructions: `cargo build --target wasm32-unknown-unknown --release`
    - Test instructions: `cargo test`
    - CLI commands: initialize, deposit, report, confirm with example parameters
    - Shipment lifecycle state diagram (text-based)
    - _Requirements: All (user-facing documentation)_
    - _Design: Overview, Architecture sections_

- [x] 14. Final checkpoint — Full build and test suite
  - Ensure all tests pass, contract compiles to WASM, and deployment script is valid. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate the 5 specific scenarios required by the tech stack
- All token operations use `soroban_sdk::token::Client` for USDC interaction
- TTL extension (`extend_ttl`) is called on every mutation per Requirement 9.5
- Storage uses PascalCase `StorageKey` enum per Requirement 9.2

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["4.1", "5.1", "6.1"] },
    { "id": 5, "tasks": ["8.1"] },
    { "id": 6, "tasks": ["8.2", "8.3", "8.4", "8.5", "8.6"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7"] },
    { "id": 8, "tasks": ["12.1", "13.1"] }
  ]
}
```
