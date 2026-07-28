# Requirements Document

## Introduction

OmniCold is an IoT-integrated escrow dApp built on Stellar/Soroban that provides trustless, automated penalty enforcement for cold-chain logistics. The contract holds USDC bonds deposited by logistics providers and automatically slashes those bonds when an authorized IoT oracle reports a temperature threshold breach during cargo transit. The system eliminates manual dispute resolution by enforcing financial penalties atomically on-chain.

## Glossary

- **Contract**: The OmniCold Soroban smart contract deployed on Stellar that manages shipment lifecycle, bond escrow, and breach enforcement
- **Shipper**: A pharmaceutical distributor who creates a shipment, defines temperature thresholds, and receives slashed bond funds upon breach
- **Logistics_Provider**: A cold-chain transport company that deposits a USDC bond as guarantee of temperature compliance during transit
- **Oracle**: An authorized Stellar address representing an IoT temperature sensor that reports temperature readings on-chain to the Contract
- **Bond**: A USDC amount deposited by the Logistics_Provider into the Contract as collateral guaranteeing temperature compliance
- **Shipment**: A record stored in the Contract representing a single cargo transit with defined temperature thresholds, participants, and lifecycle state
- **Temperature_Threshold**: A pair of minimum and maximum integer values (in centidegrees Celsius) defining the acceptable temperature range for a Shipment
- **Breach**: A condition where a reported temperature reading falls outside the Temperature_Threshold bounds (below minimum or above maximum)
- **Slashing**: The atomic transfer of the full Bond amount from the Contract escrow to the Shipper address upon Breach detection
- **Shipment_State**: The lifecycle state of a Shipment, one of: Created, Active, Delivered, or Breached
- **USDC**: Circle-issued stablecoin on Stellar, used for all Bond movements via the Soroban token interface

## Requirements

### Requirement 1: Shipment Initialization

**User Story:** As a Shipper, I want to create a shipment with temperature thresholds and participant addresses, so that the Contract can enforce cold-chain compliance for my cargo.

#### Acceptance Criteria

1. WHEN the Shipper invokes the `initialize_shipment` function with a minimum temperature, maximum temperature, Logistics_Provider address, Oracle address, and Bond amount, THE Contract SHALL create a new Shipment record in persistent storage with Shipment_State set to Created, the Shipper address stored as the transaction invoker, and all provided parameters (minimum temperature, maximum temperature, Logistics_Provider address, Oracle address, and Bond amount) stored exactly as supplied
2. IF the minimum temperature is greater than or equal to the maximum temperature, THEN THE Contract SHALL reject the initialization and return an error indicating that the temperature range is invalid
3. IF a Shipment already exists in storage, THEN THE Contract SHALL reject the initialization and return an error indicating that a Shipment has already been created
4. IF the Bond amount is less than or equal to zero, THEN THE Contract SHALL reject the initialization and return an error indicating that the Bond amount must be positive
5. IF the Logistics_Provider address or Oracle address is identical to the Shipper address, THEN THE Contract SHALL reject the initialization and return an error indicating that participant addresses must be distinct

### Requirement 2: Bond Deposit

**User Story:** As a Logistics_Provider, I want to deposit my USDC bond into the Contract escrow, so that the Shipper has financial assurance of my temperature compliance.

#### Acceptance Criteria

1. WHEN the Logistics_Provider invokes the `deposit_bond` function, THE Contract SHALL transfer the Bond_Amount (as specified during contract initialization) in USDC from the Logistics_Provider address to the Contract address using the Soroban token interface
2. WHEN the Bond deposit transfer completes successfully, THE Contract SHALL transition the Shipment_State from Created to Active
3. IF an address other than the designated Logistics_Provider invokes `deposit_bond`, THEN THE Contract SHALL reject the transaction and return an error indicating that the caller is not the authorized Logistics_Provider
4. IF the Shipment_State is not Created when `deposit_bond` is invoked, THEN THE Contract SHALL reject the transaction and return an error indicating that the shipment is not in the correct state for bond deposit
5. IF the USDC token transfer fails during `deposit_bond` (e.g., insufficient balance or insufficient allowance), THEN THE Contract SHALL reject the transaction, leave the Shipment_State unchanged at Created, and return an error indicating that the token transfer failed

### Requirement 3: Temperature Reporting

**User Story:** As an Oracle, I want to report temperature readings on-chain, so that the Contract can verify cold-chain compliance in real time.

#### Acceptance Criteria

1. WHEN the Oracle invokes the `report_temperature` function with a reading that is within the stored Temperature_Threshold bounds (greater than or equal to minimum AND less than or equal to maximum), THE Contract SHALL accept the reading without triggering a Breach and maintain the Shipment_State as Active
2. WHEN the Oracle invokes the `report_temperature` function with a reading that is below the minimum Temperature_Threshold or above the maximum Temperature_Threshold, THE Contract SHALL trigger breach detection and slashing logic
3. IF an address other than the designated Oracle invokes `report_temperature`, THEN THE Contract SHALL reject the transaction and return an error indicating the caller is not authorized
4. IF the Shipment_State is not Active when `report_temperature` is invoked, THEN THE Contract SHALL reject the transaction and return an error indicating the shipment is not in a reportable state

### Requirement 4: Breach Detection and Automatic Slashing

**User Story:** As a Shipper, I want the Contract to automatically slash the logistics provider bond when a temperature breach occurs, so that I receive immediate compensation without manual dispute resolution.

#### Acceptance Criteria

1. WHILE Shipment_State is Active, WHEN the Oracle reports a temperature reading that is below the minimum Temperature_Threshold, THE Contract SHALL detect a Breach condition
2. WHILE Shipment_State is Active, WHEN the Oracle reports a temperature reading that is above the maximum Temperature_Threshold, THE Contract SHALL detect a Breach condition
3. WHEN a Breach condition is detected, THE Contract SHALL atomically transfer the full Bond amount in USDC from the Contract address to the Shipper address using the Soroban token interface and transition the Shipment_State from Active to Breached within the same invocation
4. WHEN a temperature reading is within the Temperature_Threshold bounds (greater than or equal to minimum AND less than or equal to maximum), THE Contract SHALL accept the reading without triggering a Breach
5. IF the Oracle reports a temperature reading while Shipment_State is not Active, THEN THE Contract SHALL reject the reading and return an error indicating that the shipment is not in an active state
6. IF the USDC transfer to the Shipper address fails during breach slashing, THEN THE Contract SHALL revert the entire transaction, preserving the original Shipment_State and Bond amount

### Requirement 5: Successful Delivery Confirmation

**User Story:** As a Shipper, I want to confirm successful delivery so that the Logistics_Provider bond is released back, completing the shipment lifecycle without penalty.

#### Acceptance Criteria

1. WHEN the Shipper invokes the `confirm_delivery` function, THE Contract SHALL transfer the full Bond amount in USDC from the Contract address back to the Logistics_Provider address using the Soroban token interface
2. WHEN the Bond release transfer completes successfully, THE Contract SHALL transition the Shipment_State from Active to Delivered
3. IF an address other than the Shipper invokes `confirm_delivery`, THEN THE Contract SHALL reject the transaction and return an error indicating that only the Shipper address is authorized to confirm delivery
4. IF the Shipment_State is not Active when `confirm_delivery` is invoked, THEN THE Contract SHALL reject the transaction and return an error indicating the current Shipment_State and that delivery confirmation is only permitted in Active state
5. IF the Bond release transfer fails when the Shipper invokes `confirm_delivery`, THEN THE Contract SHALL leave the Shipment_State unchanged as Active and return an error indicating that the bond release transfer failed

### Requirement 6: Duplicate Breach Protection

**User Story:** As a system operator, I want the Contract to reject duplicate breach reports for an already-breached shipment, so that the system maintains consistent state and prevents double-slashing.

#### Acceptance Criteria

1. WHILE the Shipment_State is Breached, WHEN `report_temperature` is invoked, THE Contract SHALL reject the invocation, return an error indicating that the shipment is already breached, and leave the Shipment_State unchanged
2. WHILE the Shipment_State is Delivered, WHEN `report_temperature` is invoked, THE Contract SHALL reject the invocation, return an error indicating that the shipment is already in a terminal state, and leave the Shipment_State unchanged
3. WHILE the Shipment_State is Breached, WHEN `report_temperature` is invoked, THE Contract SHALL NOT execute any bond token transfer

### Requirement 7: Access Control Enforcement

**User Story:** As a system architect, I want strict role-based access control on all contract functions, so that only authorized participants can perform their designated actions.

#### Acceptance Criteria

1. THE Contract SHALL enforce invoker authorization on every state-mutating function call, where the authorized roles are: Logistics_Provider for `deposit_bond`, Oracle for `report_temperature`, and Shipper for `confirm_delivery`
2. WHEN an address other than the Logistics_Provider invokes `deposit_bond`, THE Contract SHALL revert the transaction, leave contract state unchanged, and return an error indicating access denied
3. WHEN an address other than the Oracle invokes `report_temperature`, THE Contract SHALL revert the transaction, leave contract state unchanged, and return an error indicating access denied
4. WHEN an address other than the Shipper invokes `confirm_delivery`, THE Contract SHALL revert the transaction, leave contract state unchanged, and return an error indicating access denied
5. IF an unauthorized address invokes any state-mutating function, THEN THE Contract SHALL ensure that no storage values, token balances, or shipment state are modified by the rejected call

### Requirement 8: Shipment State Machine Integrity

**User Story:** As a system architect, I want the Contract to enforce a strict state machine for shipment lifecycle, so that operations only execute in valid states and transitions are deterministic.

#### Acceptance Criteria

1. THE Contract SHALL enforce the following valid state transitions: Created to Active (via bond deposit), Active to Delivered (via delivery confirmation), Active to Breached (via breach report from the authorized oracle)
2. IF any function attempts a state transition not listed in the valid transitions, THEN THE Contract SHALL reject the transaction with an error indicating the current state and the disallowed transition
3. WHEN a state transition succeeds, THE Contract SHALL persist the new Shipment_State in Soroban persistent storage before returning success
4. IF any function attempts a state transition on a Shipment in Breached state, THEN THE Contract SHALL reject the transaction with an error indicating the shipment is in a terminal state
5. IF any function attempts a state transition on a Shipment in Delivered state, THEN THE Contract SHALL reject the transaction with an error indicating the shipment is in a terminal state
6. WHEN the Contract is initialized for a shipment, THE Contract SHALL set the Shipment_State to Created and persist it in Soroban persistent storage
7. IF a shipment has already been initialized, THEN THE Contract SHALL reject any subsequent initialization attempt for the same shipment with an error indicating duplicate initialization

### Requirement 9: Storage and Data Integrity

**User Story:** As a system architect, I want shipment data persisted reliably in Soroban storage, so that contract state survives across invocations and is auditable on-chain.

#### Acceptance Criteria

1. THE Contract SHALL use Soroban persistent storage for all Shipment data: Shipment_State, minimum temperature, maximum temperature, Shipper address, Logistics_Provider address, Oracle address, and Bond amount
2. THE Contract SHALL use PascalCase enum variants for all storage key identifiers
3. THE Contract SHALL ensure that serializing a Shipment record to storage and deserializing it back produces a value equal to the original across all fields (round-trip integrity)
4. IF a storage write operation fails during a state-mutating function, THEN THE Contract SHALL abort the transaction with no partial state changes persisted
5. THE Contract SHALL extend the TTL of all persistent storage entries upon every successful state-mutating invocation to prevent archival of active Shipment data
