# Product Context — OmniCold Escrow dApp

## Target Users

- **Pharmaceutical Distributors**: Ship temperature-sensitive medications and biologics; need guarantees that cold-chain integrity is maintained during transit.
- **Cold-Chain Logistics Providers**: Transport refrigerated cargo; post bonds as guarantee of service-level compliance.
- **Cargo Insurers**: Underwrite cold-chain shipments; benefit from automated, transparent penalty enforcement that reduces disputes.

## Problem Statement

Cold-chain logistics for pharmaceuticals and biologics lack trustless, automated penalty enforcement when temperature thresholds are breached during transit. Current dispute resolution relies on manual claims, delayed arbitration, and opaque sensor data. This creates:

1. Delayed compensation for shippers when breaches occur
2. Disputed sensor readings with no on-chain audit trail
3. No automated financial consequence for logistics providers who violate SLAs

## Vision

OmniCold is an IoT-integrated escrow dApp on Stellar/Soroban that holds USDC bonds in escrow and automatically slashes them when an authorized IoT oracle reports a temperature threshold breach. The system provides:

- Trustless bond management with real USDC token movements
- Automated penalty enforcement without human arbitration
- Immutable on-chain record of temperature breach events
- Clear shipment lifecycle from creation through completion or slashing

## Success Metrics

- Bond deposit and release execute in a single Stellar transaction
- Breach-to-slash latency is bounded by Stellar block confirmation time
- Zero manual intervention required for penalty enforcement after breach report
