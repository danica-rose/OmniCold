#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Env, Address, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ShipmentStatus {
    Created,
    Active,
    Delivered,
    Breached,
}

/// Stores all data for a single shipment.
#[contracttype]
#[derive(Clone)]
pub struct Shipment {
    pub status: ShipmentStatus,
    pub shipper: Address,
    pub logistics_provider: Address,
    pub oracle: Address,
    pub min_temp: i32,
    pub max_temp: i32,
    pub bond_amount: i128,
    pub usdc_token: Address,
}

/// Storage keys — shipments stored by ID, plus a global counter.
#[contracttype]
#[derive(Clone)]
pub enum StorageKey {
    /// Maps shipment_id (u32) → Shipment struct
    Shipment(u32),
    /// Global shipment counter
    Counter,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    InvalidTempRange = 1,
    InvalidBondAmount = 2,
    DuplicateParticipant = 3,
    NotLogisticsProvider = 4,
    NotOracle = 5,
    NotShipper = 6,
    InvalidState = 7,
    ShipmentNotFound = 8,
    TransferFailed = 9,
}

const LIFETIME_THRESHOLD: u32 = 17_280;
const BUMP_AMOUNT: u32 = 518_400;

#[contract]
pub struct OmniColdContract;

#[contractimpl]
impl OmniColdContract {
    /// Creates a new shipment. Returns the shipment ID.
    /// Any wallet can create a shipment — no restrictions.
    pub fn initialize_shipment(
        env: Env,
        shipper: Address,
        usdc_token: Address,
        min_temp: i32,
        max_temp: i32,
        logistics_provider: Address,
        oracle: Address,
        bond_amount: i128,
    ) -> Result<u32, ContractError> {
        shipper.require_auth();

        // Validate temperature range
        if min_temp >= max_temp {
            return Err(ContractError::InvalidTempRange);
        }

        // Validate bond amount
        if bond_amount <= 0 {
            return Err(ContractError::InvalidBondAmount);
        }

        // Validate participant uniqueness
        if logistics_provider == shipper || oracle == shipper || oracle == logistics_provider {
            return Err(ContractError::DuplicateParticipant);
        }

        // Get and increment the global counter
        let shipment_id: u32 = env
            .storage()
            .persistent()
            .get(&StorageKey::Counter)
            .unwrap_or(0);
        let next_id = shipment_id + 1;
        env.storage().persistent().set(&StorageKey::Counter, &next_id);

        // Create the shipment struct
        let shipment = Shipment {
            status: ShipmentStatus::Created,
            shipper,
            logistics_provider,
            oracle,
            min_temp,
            max_temp,
            bond_amount,
            usdc_token,
        };

        // Store the shipment
        let key = StorageKey::Shipment(shipment_id);
        env.storage().persistent().set(&key, &shipment);
        env.storage().persistent().extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Counter, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "shipment_created"),),
            shipment_id,
        );

        Ok(shipment_id)
    }

    /// Logistics provider deposits the bond. State: Created → Active.
    pub fn deposit_bond(env: Env, logistics_provider: Address, shipment_id: u32) -> Result<(), ContractError> {
        logistics_provider.require_auth();

        let key = StorageKey::Shipment(shipment_id);
        let mut shipment: Shipment = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ShipmentNotFound)?;

        // Verify caller is the designated LP
        if logistics_provider != shipment.logistics_provider {
            return Err(ContractError::NotLogisticsProvider);
        }

        // Verify state
        if shipment.status != ShipmentStatus::Created {
            return Err(ContractError::InvalidState);
        }

        // Demo mode: skip USDC transfer, just transition state
        shipment.status = ShipmentStatus::Active;
        env.storage().persistent().set(&key, &shipment);
        env.storage().persistent().extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "bond_deposited"),),
            shipment_id,
        );

        Ok(())
    }

    /// Oracle reports a temperature reading.
    /// If out of range → breach. If in range → stays Active.
    pub fn report_temperature(env: Env, oracle: Address, shipment_id: u32, temperature: i32) -> Result<(), ContractError> {
        oracle.require_auth();

        let key = StorageKey::Shipment(shipment_id);
        let mut shipment: Shipment = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ShipmentNotFound)?;

        // Verify caller is the designated oracle
        if oracle != shipment.oracle {
            return Err(ContractError::NotOracle);
        }

        // Verify state
        if shipment.status != ShipmentStatus::Active {
            return Err(ContractError::InvalidState);
        }

        // Check if temperature is within range
        if temperature >= shipment.min_temp && temperature <= shipment.max_temp {
            // In-range — just bump TTL
            env.storage().persistent().extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            return Ok(());
        }

        // Out-of-range — breach (demo mode: no USDC transfer)
        shipment.status = ShipmentStatus::Breached;
        env.storage().persistent().set(&key, &shipment);
        env.storage().persistent().extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "breach_detected"),),
            shipment_id,
        );

        Ok(())
    }

    /// Shipper confirms delivery. State: Active → Delivered.
    pub fn confirm_delivery(env: Env, shipper: Address, shipment_id: u32) -> Result<(), ContractError> {
        shipper.require_auth();

        let key = StorageKey::Shipment(shipment_id);
        let mut shipment: Shipment = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::ShipmentNotFound)?;

        // Verify caller is the shipper
        if shipper != shipment.shipper {
            return Err(ContractError::NotShipper);
        }

        // Verify state
        if shipment.status != ShipmentStatus::Active {
            return Err(ContractError::InvalidState);
        }

        // Demo mode: no USDC transfer, just transition
        shipment.status = ShipmentStatus::Delivered;
        env.storage().persistent().set(&key, &shipment);
        env.storage().persistent().extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "delivery_confirmed"),),
            shipment_id,
        );

        Ok(())
    }

    /// Read a shipment's data. Returns None if not found.
    pub fn get_shipment(env: Env, shipment_id: u32) -> Option<Shipment> {
        let key = StorageKey::Shipment(shipment_id);
        env.storage().persistent().get(&key)
    }

    /// Get the total number of shipments created.
    pub fn get_shipment_count(env: Env) -> u32 {
        env.storage()
            .persistent()
            .get(&StorageKey::Counter)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
