#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, token, Env, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ShipmentStatus {
    Created,
    Active,
    Delivered,
    Breached,
}

#[contracttype]
#[derive(Clone)]
pub enum StorageKey {
    ShipmentState,
    MinTemp,
    MaxTemp,
    Shipper,
    LogisticsProvider,
    Oracle,
    BondAmount,
    UsdcToken,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    InvalidTempRange = 2,
    InvalidBondAmount = 3,
    DuplicateParticipant = 4,
    NotLogisticsProvider = 5,
    NotOracle = 6,
    NotShipper = 7,
    InvalidState = 8,
    TransferFailed = 9,
}

const LIFETIME_THRESHOLD: u32 = 17_280;
const BUMP_AMOUNT: u32 = 518_400;

#[contract]
pub struct OmniColdContract;

#[contractimpl]
impl OmniColdContract {
    /// Creates a new shipment with temperature thresholds and participant roles.
    /// Caller (shipper) must authorize. State → Created.
    pub fn initialize_shipment(
        env: Env,
        shipper: Address,
        usdc_token: Address,
        min_temp: i32,
        max_temp: i32,
        logistics_provider: Address,
        oracle: Address,
        bond_amount: i128,
    ) -> Result<(), ContractError> {
        // Authenticate the shipper
        shipper.require_auth();

        // Guard against re-initialization
        if env.storage().persistent().has(&StorageKey::ShipmentState) {
            return Err(ContractError::AlreadyInitialized);
        }

        // Validate temperature range
        if min_temp >= max_temp {
            return Err(ContractError::InvalidTempRange);
        }

        // Validate bond amount
        if bond_amount <= 0 {
            return Err(ContractError::InvalidBondAmount);
        }

        // Validate participant uniqueness
        if logistics_provider == shipper || oracle == shipper {
            return Err(ContractError::DuplicateParticipant);
        }

        // Store all fields to persistent storage
        env.storage().persistent().set(&StorageKey::ShipmentState, &ShipmentStatus::Created);
        env.storage().persistent().set(&StorageKey::MinTemp, &min_temp);
        env.storage().persistent().set(&StorageKey::MaxTemp, &max_temp);
        env.storage().persistent().set(&StorageKey::Shipper, &shipper);
        env.storage().persistent().set(&StorageKey::LogisticsProvider, &logistics_provider);
        env.storage().persistent().set(&StorageKey::Oracle, &oracle);
        env.storage().persistent().set(&StorageKey::BondAmount, &bond_amount);
        env.storage().persistent().set(&StorageKey::UsdcToken, &usdc_token);

        // Extend TTL on all written keys
        env.storage().persistent().extend_ttl(&StorageKey::ShipmentState, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MinTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MaxTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Shipper, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::LogisticsProvider, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Oracle, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::BondAmount, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::UsdcToken, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(())
    }

    /// Logistics provider deposits the bond. State: Created → Active.
    pub fn deposit_bond(env: Env, logistics_provider: Address) -> Result<(), ContractError> {
        // Authenticate the logistics provider
        logistics_provider.require_auth();

        // Read stored logistics provider and verify caller matches
        let stored_lp: Address = env.storage().persistent().get(&StorageKey::LogisticsProvider).unwrap();
        if logistics_provider != stored_lp {
            return Err(ContractError::NotLogisticsProvider);
        }

        // Verify shipment state is Created
        let state: ShipmentStatus = env.storage().persistent().get(&StorageKey::ShipmentState).unwrap();
        if state != ShipmentStatus::Created {
            return Err(ContractError::InvalidState);
        }

        // Read bond amount and USDC token address from storage
        let bond_amount: i128 = env.storage().persistent().get(&StorageKey::BondAmount).unwrap();
        let usdc_token_address: Address = env.storage().persistent().get(&StorageKey::UsdcToken).unwrap();

        // Transfer bond from LP to contract
        let token_client = token::Client::new(&env, &usdc_token_address);
        token_client.transfer(&logistics_provider, &env.current_contract_address(), &bond_amount);

        // Transition state to Active
        env.storage().persistent().set(&StorageKey::ShipmentState, &ShipmentStatus::Active);

        // Extend TTL on all persistent keys
        env.storage().persistent().extend_ttl(&StorageKey::ShipmentState, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MinTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MaxTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Shipper, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::LogisticsProvider, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Oracle, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::BondAmount, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::UsdcToken, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(())
    }

    /// Oracle reports a temperature reading. If out of range, triggers breach + slash.
    /// State remains Active if in-range; transitions to Breached if out of range.
    pub fn report_temperature(env: Env, oracle: Address, temperature: i32) -> Result<(), ContractError> {
        // Authenticate the oracle
        oracle.require_auth();

        // Read stored oracle address and verify caller matches
        let stored_oracle: Address = env.storage().persistent().get(&StorageKey::Oracle).unwrap();
        if oracle != stored_oracle {
            return Err(ContractError::NotOracle);
        }

        // Verify shipment state is Active
        let state: ShipmentStatus = env.storage().persistent().get(&StorageKey::ShipmentState).unwrap();
        if state != ShipmentStatus::Active {
            return Err(ContractError::InvalidState);
        }

        // Read temperature thresholds
        let min_temp: i32 = env.storage().persistent().get(&StorageKey::MinTemp).unwrap();
        let max_temp: i32 = env.storage().persistent().get(&StorageKey::MaxTemp).unwrap();

        // Check if temperature is within range
        if temperature >= min_temp && temperature <= max_temp {
            // In-range — extend TTL and return
            env.storage().persistent().extend_ttl(&StorageKey::ShipmentState, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::MinTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::MaxTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::Shipper, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::LogisticsProvider, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::Oracle, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::BondAmount, LIFETIME_THRESHOLD, BUMP_AMOUNT);
            env.storage().persistent().extend_ttl(&StorageKey::UsdcToken, LIFETIME_THRESHOLD, BUMP_AMOUNT);

            return Ok(());
        }

        // Out-of-range — trigger breach and slash
        let bond_amount: i128 = env.storage().persistent().get(&StorageKey::BondAmount).unwrap();
        let usdc_token: Address = env.storage().persistent().get(&StorageKey::UsdcToken).unwrap();
        let shipper: Address = env.storage().persistent().get(&StorageKey::Shipper).unwrap();

        // Transfer full bond from contract to shipper
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &shipper, &bond_amount);

        // Transition state to Breached
        env.storage().persistent().set(&StorageKey::ShipmentState, &ShipmentStatus::Breached);

        // Extend TTL on all persistent keys
        env.storage().persistent().extend_ttl(&StorageKey::ShipmentState, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MinTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MaxTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Shipper, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::LogisticsProvider, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Oracle, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::BondAmount, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::UsdcToken, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(())
    }

    /// Shipper confirms delivery. Bond returned to logistics provider.
    /// State: Active → Delivered.
    pub fn confirm_delivery(env: Env, shipper: Address) -> Result<(), ContractError> {
        // Authenticate the shipper
        shipper.require_auth();

        // Read stored shipper address and verify caller matches
        let stored_shipper: Address = env.storage().persistent().get(&StorageKey::Shipper).unwrap();
        if shipper != stored_shipper {
            return Err(ContractError::NotShipper);
        }

        // Verify shipment state is Active
        let state: ShipmentStatus = env.storage().persistent().get(&StorageKey::ShipmentState).unwrap();
        if state != ShipmentStatus::Active {
            return Err(ContractError::InvalidState);
        }

        // Read bond amount, USDC token address, and logistics provider from storage
        let bond_amount: i128 = env.storage().persistent().get(&StorageKey::BondAmount).unwrap();
        let usdc_token: Address = env.storage().persistent().get(&StorageKey::UsdcToken).unwrap();
        let logistics_provider: Address = env.storage().persistent().get(&StorageKey::LogisticsProvider).unwrap();

        // Transfer full bond from contract to logistics provider
        let token_client = token::Client::new(&env, &usdc_token);
        token_client.transfer(&env.current_contract_address(), &logistics_provider, &bond_amount);

        // Transition state to Delivered
        env.storage().persistent().set(&StorageKey::ShipmentState, &ShipmentStatus::Delivered);

        // Extend TTL on all persistent keys
        env.storage().persistent().extend_ttl(&StorageKey::ShipmentState, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MinTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::MaxTemp, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Shipper, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::LogisticsProvider, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::Oracle, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::BondAmount, LIFETIME_THRESHOLD, BUMP_AMOUNT);
        env.storage().persistent().extend_ttl(&StorageKey::UsdcToken, LIFETIME_THRESHOLD, BUMP_AMOUNT);

        Ok(())
    }
}

#[cfg(test)]
mod test;
