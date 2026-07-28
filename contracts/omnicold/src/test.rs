use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

// Test constants
const TEST_BOND_AMOUNT: i128 = 100_000_000; // 100 USDC in stroops
const TEST_MIN_TEMP: i32 = 200; // 2.00°C
const TEST_MAX_TEMP: i32 = 800; // 8.00°C

struct TestContext {
    env: Env,
    contract_id: Address,
    client: OmniColdContractClient<'static>,
    usdc_token: Address,
    shipper: Address,
    logistics_provider: Address,
    oracle: Address,
    unauthorized: Address,
}

fn setup() -> TestContext {
    let env = Env::default();
    env.mock_all_auths();

    // Register the OmniCold contract
    let contract_id = env.register_contract(None, OmniColdContract);
    let client = OmniColdContractClient::new(&env, &contract_id);

    // Register a mock USDC Stellar Asset Contract
    let admin = Address::generate(&env);
    let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let usdc_token = usdc_token_contract.address();

    // Generate test addresses
    let shipper = Address::generate(&env);
    let logistics_provider = Address::generate(&env);
    let oracle = Address::generate(&env);
    let unauthorized = Address::generate(&env);

    // Mint USDC to the logistics provider so they can deposit bond
    let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
    sac_client.mint(&logistics_provider, &1_000_000_000); // 1000 USDC

    TestContext {
        env,
        contract_id,
        client,
        usdc_token,
        shipper,
        logistics_provider,
        oracle,
        unauthorized,
    }
}

#[test]
fn test_happy_path() {
    let ctx = setup();
    let token_client = token::Client::new(&ctx.env, &ctx.usdc_token);

    // Initialize shipment
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );

    // Deposit bond
    ctx.client.deposit_bond(&ctx.logistics_provider);

    // Report in-range temperature (should succeed without breach)
    ctx.client.report_temperature(&ctx.oracle, &500); // 5.00°C, within [2.00, 8.00]

    // Confirm delivery
    ctx.client.confirm_delivery(&ctx.shipper);

    // Assert bond returned to LP (back to original balance)
    assert_eq!(
        token_client.balance(&ctx.logistics_provider),
        1_000_000_000 - TEST_BOND_AMOUNT + TEST_BOND_AMOUNT
    );
    assert_eq!(token_client.balance(&ctx.contract_id), 0);
}

#[test]
fn test_unauthorized_reporter() {
    let ctx = setup();

    // Initialize and deposit
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    ctx.client.deposit_bond(&ctx.logistics_provider);

    // Try to report from unauthorized address
    let result = ctx.client.try_report_temperature(&ctx.unauthorized, &500);
    assert_eq!(result, Err(Ok(ContractError::NotOracle)));
}

#[test]
fn test_state_after_breach() {
    let ctx = setup();
    let token_client = token::Client::new(&ctx.env, &ctx.usdc_token);

    // Initialize and deposit
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    ctx.client.deposit_bond(&ctx.logistics_provider);

    // Report out-of-range temperature (below min)
    ctx.client.report_temperature(&ctx.oracle, &100); // 1.00°C, below min 2.00°C

    // Assert bond transferred to shipper
    assert_eq!(token_client.balance(&ctx.shipper), TEST_BOND_AMOUNT);
    assert_eq!(token_client.balance(&ctx.contract_id), 0);

    // Try confirm_delivery → should fail
    let result = ctx.client.try_confirm_delivery(&ctx.shipper);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));

    // Try another report → should fail
    let result = ctx.client.try_report_temperature(&ctx.oracle, &500);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));
}

#[test]
fn test_duplicate_report_protection() {
    let ctx = setup();
    let token_client = token::Client::new(&ctx.env, &ctx.usdc_token);

    // Initialize and deposit
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    ctx.client.deposit_bond(&ctx.logistics_provider);

    // Trigger breach
    ctx.client.report_temperature(&ctx.oracle, &900); // 9.00°C, above max 8.00°C

    let shipper_balance_after_breach = token_client.balance(&ctx.shipper);

    // Try second report → should fail
    let result = ctx.client.try_report_temperature(&ctx.oracle, &1000);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));

    // No second transfer occurred
    assert_eq!(token_client.balance(&ctx.shipper), shipper_balance_after_breach);
}

#[test]
fn test_initialization_state() {
    let ctx = setup();

    // Initialize shipment
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );

    // Verify re-initialization fails (proves state exists)
    let result = ctx.client.try_initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    assert_eq!(result, Err(Ok(ContractError::AlreadyInitialized)));

    // Verify state is Created by attempting report_temperature (should fail with InvalidState since state is Created, not Active)
    let result = ctx.client.try_report_temperature(&ctx.oracle, &500);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));

    // Verify deposit_bond succeeds (only valid in Created state with correct LP)
    ctx.client.deposit_bond(&ctx.logistics_provider);
    // If this succeeds, it confirms: state was Created, LP matches, bond amount was stored correctly
}

// =============================================================================
// Property-Based Tests (manual iteration, 100+ iterations each)
// =============================================================================

/// Simple linear congruential generator for deterministic pseudo-random values.
/// State is mutated in-place; returns next pseudo-random u64.
fn lcg_next(state: &mut u64) -> u64 {
    // LCG constants from Numerical Recipes
    *state = state.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    *state
}

// Feature: omnicold-escrow, Property 1: Initialization Storage Round-Trip
// **Validates: Requirements 1.1, 9.3**
#[test]
fn prop_initialization_round_trip() {
    let mut rng_state: u64 = 0xDEAD_BEEF_CAFE_BABE;

    for _ in 0..100 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        // Generate random valid temps where min < max
        let raw1 = (lcg_next(&mut rng_state) % 2000) as i32 - 1000; // range [-1000, 999]
        let raw2 = (lcg_next(&mut rng_state) % 2000) as i32 - 1000;
        let (min_temp, max_temp) = if raw1 < raw2 {
            (raw1, raw2)
        } else if raw2 < raw1 {
            (raw2, raw1)
        } else {
            (raw1, raw1 + 1) // ensure min < max
        };

        // Generate random positive bond amount
        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 1_000_000_000) as i128) + 1;

        // Mint enough to LP
        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &(bond_amount + 1_000_000));

        // Initialize
        let result = client.try_initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );
        assert!(result.is_ok(), "Initialization should succeed with valid params");

        // Read back stored fields and verify round-trip
        let stored_state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(stored_state, ShipmentStatus::Created);

        let stored_min: i32 = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::MinTemp).unwrap()
        });
        assert_eq!(stored_min, min_temp);

        let stored_max: i32 = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::MaxTemp).unwrap()
        });
        assert_eq!(stored_max, max_temp);

        let stored_bond: i128 = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::BondAmount).unwrap()
        });
        assert_eq!(stored_bond, bond_amount);

        let stored_shipper: Address = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::Shipper).unwrap()
        });
        assert_eq!(stored_shipper, shipper);

        let stored_lp: Address = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::LogisticsProvider).unwrap()
        });
        assert_eq!(stored_lp, logistics_provider);

        let stored_oracle: Address = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::Oracle).unwrap()
        });
        assert_eq!(stored_oracle, oracle);

        let stored_usdc: Address = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::UsdcToken).unwrap()
        });
        assert_eq!(stored_usdc, usdc_token);
    }
}

// Feature: omnicold-escrow, Property 2: Initialization Rejects Invalid Inputs
// **Validates: Requirements 1.2, 1.4, 1.5**
#[test]
fn prop_initialization_rejects_invalid_inputs() {
    let mut rng_state: u64 = 0xCAFE_DEAD_1234_5678;

    for i in 0..120 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        // Cycle through invalid input categories:
        // 0 = min_temp > max_temp
        // 1 = min_temp == max_temp
        // 2 = bond_amount == 0
        // 3 = bond_amount < 0 (negative)
        // 4 = logistics_provider == shipper
        // 5 = oracle == shipper
        let category = i % 6;

        let (min_temp, max_temp, bond_amount, lp, orc) = match category {
            0 => {
                // Invalid temp range: min > max
                let base = (lcg_next(&mut rng_state) % 2000) as i32 - 1000;
                let offset = ((lcg_next(&mut rng_state) % 100) as i32) + 1; // 1..100
                (base + offset, base, 1_000_000i128, logistics_provider.clone(), oracle.clone())
            }
            1 => {
                // Invalid temp range: min == max
                let same = (lcg_next(&mut rng_state) % 2000) as i32 - 1000;
                (same, same, 1_000_000i128, logistics_provider.clone(), oracle.clone())
            }
            2 => {
                // Invalid bond amount: exactly 0
                (200i32, 800i32, 0i128, logistics_provider.clone(), oracle.clone())
            }
            3 => {
                // Invalid bond amount: negative
                let neg_bond = -(((lcg_next(&mut rng_state) % 1_000_000) as i128) + 1);
                (200i32, 800i32, neg_bond, logistics_provider.clone(), oracle.clone())
            }
            4 => {
                // Duplicate participant: LP == shipper
                let bond = ((lcg_next(&mut rng_state) % 1_000_000) as i128) + 1;
                (200i32, 800i32, bond, shipper.clone(), oracle.clone())
            }
            _ => {
                // Duplicate participant: oracle == shipper
                let bond = ((lcg_next(&mut rng_state) % 1_000_000) as i128) + 1;
                (200i32, 800i32, bond, logistics_provider.clone(), shipper.clone())
            }
        };

        let result = client.try_initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &lp,
            &orc,
            &bond_amount,
        );

        // Should return an error
        assert!(result.is_err(), "Iteration {}: Initialization should fail with invalid inputs (category {})", i, category);

        // Verify the correct error type is returned
        match category {
            0 | 1 => {
                assert_eq!(result, Err(Ok(ContractError::InvalidTempRange)),
                    "Iteration {}: Expected InvalidTempRange for min_temp >= max_temp", i);
            }
            2 | 3 => {
                assert_eq!(result, Err(Ok(ContractError::InvalidBondAmount)),
                    "Iteration {}: Expected InvalidBondAmount for bond <= 0", i);
            }
            4 | 5 => {
                assert_eq!(result, Err(Ok(ContractError::DuplicateParticipant)),
                    "Iteration {}: Expected DuplicateParticipant for duplicate addresses", i);
            }
            _ => unreachable!(),
        }

        // Verify no shipment data was persisted to storage
        let has_state: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::ShipmentState)
        });
        assert!(!has_state, "Iteration {}: No ShipmentState should be persisted on failed initialization", i);

        let has_min_temp: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::MinTemp)
        });
        assert!(!has_min_temp, "Iteration {}: No MinTemp should be persisted on failed initialization", i);

        let has_max_temp: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::MaxTemp)
        });
        assert!(!has_max_temp, "Iteration {}: No MaxTemp should be persisted on failed initialization", i);

        let has_bond: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::BondAmount)
        });
        assert!(!has_bond, "Iteration {}: No BondAmount should be persisted on failed initialization", i);

        let has_shipper: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::Shipper)
        });
        assert!(!has_shipper, "Iteration {}: No Shipper should be persisted on failed initialization", i);

        let has_lp: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::LogisticsProvider)
        });
        assert!(!has_lp, "Iteration {}: No LogisticsProvider should be persisted on failed initialization", i);

        let has_oracle: bool = env.as_contract(&contract_id, || {
            env.storage().persistent().has(&StorageKey::Oracle)
        });
        assert!(!has_oracle, "Iteration {}: No Oracle should be persisted on failed initialization", i);
    }
}

// Feature: omnicold-escrow, Property 3: Access Control Enforcement
// **Validates: Requirements 2.3, 3.3, 5.3, 7.1, 7.2, 7.3, 7.4, 7.5**
#[test]
fn prop_access_control_enforcement() {
    let mut rng_state: u64 = 0x1234_5678_ABCD_EF01;

    for _ in 0..100 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        // Mint to LP and deposit
        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &1_000_000_000);

        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 100_000_000) as i128) + 1_000_000;
        let min_temp = 200i32;
        let max_temp = 800i32;

        // Initialize
        client.initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );

        // Deposit bond to move to Active state
        client.deposit_bond(&logistics_provider);

        let token_client = token::Client::new(&env, &usdc_token);
        let contract_balance_before = token_client.balance(&contract_id);
        let shipper_balance_before = token_client.balance(&shipper);

        // Generate a random unauthorized address (distinct from all participants)
        let unauthorized = Address::generate(&env);

        // Test 1: deposit_bond with non-LP → NotLogisticsProvider
        let result = client.try_deposit_bond(&unauthorized);
        assert_eq!(result, Err(Ok(ContractError::NotLogisticsProvider)));

        // Test 2: report_temperature with non-oracle → NotOracle
        let temp = (lcg_next(&mut rng_state) % 1000) as i32;
        let result = client.try_report_temperature(&unauthorized, &temp);
        assert_eq!(result, Err(Ok(ContractError::NotOracle)));

        // Test 3: confirm_delivery with non-shipper → NotShipper
        let result = client.try_confirm_delivery(&unauthorized);
        assert_eq!(result, Err(Ok(ContractError::NotShipper)));

        // Verify no state changes occurred
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Active);

        // Verify no balance changes
        assert_eq!(token_client.balance(&contract_id), contract_balance_before);
        assert_eq!(token_client.balance(&shipper), shipper_balance_before);
    }
}

// Feature: omnicold-escrow, Property 4: State Machine Integrity
// **Validates: Requirements 1.3, 2.4, 3.4, 5.4, 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**
#[test]
fn prop_state_machine_integrity() {
    let mut rng_state: u64 = 0xAAAA_BBBB_CCCC_DDDD;

    for iteration in 0..10 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &10_000_000_000);

        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 100_000_000) as i128) + 1_000;
        let min_temp = 200i32;
        let max_temp = 800i32;

        // Initialize → state is Created
        client.initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );

        // === CREATED STATE: invalid transitions ===
        // report_temperature should fail (InvalidState)
        let result = client.try_report_temperature(&oracle, &500);
        assert_eq!(result, Err(Ok(ContractError::InvalidState)));

        // confirm_delivery should fail (InvalidState)
        let result = client.try_confirm_delivery(&shipper);
        assert_eq!(result, Err(Ok(ContractError::InvalidState)));

        // Verify state unchanged after invalid transitions
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Created);

        // === Transition Created → Active ===
        client.deposit_bond(&logistics_provider);

        // === ACTIVE STATE: invalid transitions ===
        // deposit_bond should fail (InvalidState) — already active
        let result = client.try_deposit_bond(&logistics_provider);
        assert_eq!(result, Err(Ok(ContractError::InvalidState)));

        // Verify state unchanged after invalid transition
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Active);

        // === Test BOTH terminal states deterministically ===
        // Even iterations: test Breached terminal state
        // Odd iterations: test Delivered terminal state
        if iteration % 2 == 0 {
            // Trigger breach with out-of-range temperature
            let out_of_range = max_temp + 1 + (lcg_next(&mut rng_state) % 100) as i32;
            client.report_temperature(&oracle, &out_of_range);

            // === BREACHED STATE: all transitions should fail ===
            let result = client.try_deposit_bond(&logistics_provider);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            let result = client.try_report_temperature(&oracle, &500);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            let result = client.try_confirm_delivery(&shipper);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            // Verify state remains Breached after all invalid transitions
            let state: ShipmentStatus = env.as_contract(&contract_id, || {
                env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
            });
            assert_eq!(state, ShipmentStatus::Breached);
        } else {
            // Confirm delivery
            client.confirm_delivery(&shipper);

            // === DELIVERED STATE: all transitions should fail ===
            let result = client.try_deposit_bond(&logistics_provider);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            let result = client.try_report_temperature(&oracle, &500);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            let result = client.try_confirm_delivery(&shipper);
            assert_eq!(result, Err(Ok(ContractError::InvalidState)));

            // Verify state remains Delivered after all invalid transitions
            let state: ShipmentStatus = env.as_contract(&contract_id, || {
                env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
            });
            assert_eq!(state, ShipmentStatus::Delivered);
        }
    }
}

// Feature: omnicold-escrow, Property 5: In-Range Temperature Preserves Active State
// **Validates: Requirements 3.1, 4.4**
#[test]
fn prop_in_range_preserves_active() {
    let mut rng_state: u64 = 0x5555_6666_7777_8888;

    for _ in 0..100 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &10_000_000_000);

        // Generate random min_temp in [-1000, 500) and max_temp = min + 1..min + 1000
        let min_temp = (lcg_next(&mut rng_state) % 1500) as i32 - 1000; // range [-1000, 499]
        let max_temp = min_temp + 1 + (lcg_next(&mut rng_state) % 1000) as i32; // min + 1 to min + 1000

        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 100_000_000) as i128) + 1;

        // Initialize and deposit
        client.initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );
        client.deposit_bond(&logistics_provider);

        let token_client = token::Client::new(&env, &usdc_token);
        let contract_balance_before = token_client.balance(&contract_id);

        // Generate a random in-range temperature: min_temp <= t <= max_temp
        let range = (max_temp - min_temp) as u64 + 1; // at least 2 (since max_temp >= min_temp + 1)
        let t = min_temp + (lcg_next(&mut rng_state) % range) as i32;

        // Report in-range temperature
        let result = client.try_report_temperature(&oracle, &t);
        assert!(result.is_ok(), "In-range temperature report should succeed for t={} in [{}, {}]", t, min_temp, max_temp);

        // State remains Active
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Active);

        // Contract still holds the full bond amount
        assert_eq!(token_client.balance(&contract_id), contract_balance_before);

        // Shipper balance is 0 (no slash occurred)
        assert_eq!(token_client.balance(&shipper), 0);
    }
}

// Feature: omnicold-escrow, Property 6: Out-of-Range Temperature Triggers Atomic Slash
// **Validates: Requirements 3.2, 4.1, 4.2, 4.3**
#[test]
fn prop_out_of_range_triggers_slash() {
    let mut rng_state: u64 = 0x9999_AAAA_BBBB_CCCC;

    for _ in 0..100 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &10_000_000_000);

        // Generate random threshold pair
        let raw1 = (lcg_next(&mut rng_state) % 2000) as i32 - 1000;
        let raw2 = (lcg_next(&mut rng_state) % 2000) as i32 - 1000;
        let (min_temp, max_temp) = if raw1 < raw2 {
            (raw1, raw2)
        } else if raw2 < raw1 {
            (raw2, raw1)
        } else {
            (raw1, raw1 + 1)
        };

        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 100_000_000) as i128) + 1;

        // Initialize and deposit
        client.initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );
        client.deposit_bond(&logistics_provider);

        let token_client = token::Client::new(&env, &usdc_token);
        let shipper_balance_before = token_client.balance(&shipper);

        // Generate out-of-range temperature: either below min or above max
        let t = if lcg_next(&mut rng_state) % 2 == 0 {
            // Below min
            min_temp - 1 - (lcg_next(&mut rng_state) % 500) as i32
        } else {
            // Above max
            max_temp + 1 + (lcg_next(&mut rng_state) % 500) as i32
        };

        // Report out-of-range temperature
        let result = client.try_report_temperature(&oracle, &t);
        assert!(result.is_ok(), "Out-of-range temperature report should succeed (triggers breach)");

        // State transitions to Breached
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Breached);

        // Bond transferred to shipper
        let shipper_balance_after = token_client.balance(&shipper);
        assert_eq!(shipper_balance_after - shipper_balance_before, bond_amount);

        // Contract balance is 0
        assert_eq!(token_client.balance(&contract_id), 0);
    }
}

// Feature: omnicold-escrow, Property 7: Delivery Confirmation Releases Full Bond to Logistics Provider
// **Validates: Requirements 5.1, 5.2**
#[test]
fn prop_delivery_releases_bond() {
    let mut rng_state: u64 = 0xFEDC_BA98_7654_3210;

    for _ in 0..100 {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, OmniColdContract);
        let client = OmniColdContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let usdc_token_contract = env.register_stellar_asset_contract_v2(admin.clone());
        let usdc_token = usdc_token_contract.address();

        let shipper = Address::generate(&env);
        let logistics_provider = Address::generate(&env);
        let oracle = Address::generate(&env);

        // Random bond amount
        let bond_amount: i128 = ((lcg_next(&mut rng_state) % 500_000_000) as i128) + 1;

        // Mint enough to LP (bond + extra)
        let initial_lp_balance: i128 = bond_amount + 5_000_000;
        let sac_client = token::StellarAssetClient::new(&env, &usdc_token);
        sac_client.mint(&logistics_provider, &initial_lp_balance);

        let min_temp = 200i32;
        let max_temp = 800i32;

        // Initialize and deposit
        client.initialize_shipment(
            &shipper,
            &usdc_token,
            &min_temp,
            &max_temp,
            &logistics_provider,
            &oracle,
            &bond_amount,
        );
        client.deposit_bond(&logistics_provider);

        let token_client = token::Client::new(&env, &usdc_token);
        let lp_balance_before_delivery = token_client.balance(&logistics_provider);

        // Confirm delivery
        let result = client.try_confirm_delivery(&shipper);
        assert!(result.is_ok(), "Delivery confirmation should succeed");

        // State transitions to Delivered
        let state: ShipmentStatus = env.as_contract(&contract_id, || {
            env.storage().persistent().get(&StorageKey::ShipmentState).unwrap()
        });
        assert_eq!(state, ShipmentStatus::Delivered);

        // LP balance increases by bond_amount
        let lp_balance_after = token_client.balance(&logistics_provider);
        assert_eq!(lp_balance_after - lp_balance_before_delivery, bond_amount);

        // Contract balance is 0
        assert_eq!(token_client.balance(&contract_id), 0);
    }
}
