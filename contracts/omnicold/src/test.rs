use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

// Test constants
const TEST_BOND_AMOUNT: i128 = 100_000_000; // 10 USDC in stroops
const TEST_MIN_TEMP: i32 = 200; // 2.00°C
const TEST_MAX_TEMP: i32 = 800; // 8.00°C

struct TestContext {
    env: Env,
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

    let contract_id = env.register(OmniColdContract, ());
    let client = OmniColdContractClient::new(&env, &contract_id);

    let usdc_token = Address::generate(&env);
    let shipper = Address::generate(&env);
    let logistics_provider = Address::generate(&env);
    let oracle = Address::generate(&env);
    let unauthorized = Address::generate(&env);

    TestContext {
        env,
        client,
        usdc_token,
        shipper,
        logistics_provider,
        oracle,
        unauthorized,
    }
}

/// Helper: initialize a shipment and return the ID
fn init_shipment(ctx: &TestContext) -> u32 {
    ctx.client.initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    )
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 1: Happy path — full lifecycle
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_happy_path_full_lifecycle() {
    let ctx = setup();

    // Initialize
    let id = init_shipment(&ctx);
    assert_eq!(id, 0);

    // Verify state
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Created);

    // Deposit bond
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Active);

    // Report in-range temperature
    ctx.client.report_temperature(&ctx.oracle, &id, &500); // 5.0°C
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Active);

    // Confirm delivery
    ctx.client.confirm_delivery(&ctx.shipper, &id);
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Delivered);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 2: Unauthorized reporter failure
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_unauthorized_oracle_rejected() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);

    // Unauthorized address tries to report
    let result = ctx.client.try_report_temperature(&ctx.unauthorized, &id, &500);
    assert_eq!(result, Err(Ok(ContractError::NotOracle)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 3: Breach detection and state transition
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_breach_detected_state_transition() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);

    // Report out-of-range temperature (too hot)
    ctx.client.report_temperature(&ctx.oracle, &id, &1000); // 10.0°C > max 8.0°C
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Breached);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 4: Duplicate reporting after breach is rejected
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_duplicate_report_after_breach_rejected() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);

    // Trigger breach
    ctx.client.report_temperature(&ctx.oracle, &id, &1000);

    // Second report on breached shipment should fail
    let result = ctx.client.try_report_temperature(&ctx.oracle, &id, &500);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 5: Initialization state validation
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_initialization_validation() {
    let ctx = setup();

    // Invalid temp range (min >= max)
    let result = ctx.client.try_initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &800, // min
        &200, // max (less than min!)
        &ctx.logistics_provider,
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    assert_eq!(result, Err(Ok(ContractError::InvalidTempRange)));

    // Invalid bond amount (zero)
    let result = ctx.client.try_initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.logistics_provider,
        &ctx.oracle,
        &0,
    );
    assert_eq!(result, Err(Ok(ContractError::InvalidBondAmount)));

    // Duplicate participant (provider == shipper)
    let result = ctx.client.try_initialize_shipment(
        &ctx.shipper,
        &ctx.usdc_token,
        &TEST_MIN_TEMP,
        &TEST_MAX_TEMP,
        &ctx.shipper, // same as shipper!
        &ctx.oracle,
        &TEST_BOND_AMOUNT,
    );
    assert_eq!(result, Err(Ok(ContractError::DuplicateParticipant)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 6: Multiple shipments on same contract
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_multiple_shipments() {
    let ctx = setup();

    let id1 = init_shipment(&ctx);
    let id2 = init_shipment(&ctx);
    let id3 = init_shipment(&ctx);

    assert_eq!(id1, 0);
    assert_eq!(id2, 1);
    assert_eq!(id3, 2);
    assert_eq!(ctx.client.get_shipment_count(), 3);

    // Each shipment is independent
    ctx.client.deposit_bond(&ctx.logistics_provider, &id1);
    let s1 = ctx.client.get_shipment(&id1).unwrap();
    let s2 = ctx.client.get_shipment(&id2).unwrap();
    assert_eq!(s1.status, ShipmentStatus::Active);
    assert_eq!(s2.status, ShipmentStatus::Created); // unaffected
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 7: Not logistics provider cannot deposit
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_wrong_provider_cannot_deposit() {
    let ctx = setup();
    let id = init_shipment(&ctx);

    let result = ctx.client.try_deposit_bond(&ctx.unauthorized, &id);
    assert_eq!(result, Err(Ok(ContractError::NotLogisticsProvider)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 8: Not shipper cannot confirm delivery
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_wrong_shipper_cannot_confirm() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);

    let result = ctx.client.try_confirm_delivery(&ctx.unauthorized, &id);
    assert_eq!(result, Err(Ok(ContractError::NotShipper)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 9: Cannot deposit on non-existent shipment
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_shipment_not_found() {
    let ctx = setup();

    let result = ctx.client.try_deposit_bond(&ctx.logistics_provider, &999);
    assert_eq!(result, Err(Ok(ContractError::ShipmentNotFound)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 10: Cold breach (below min temp)
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_cold_breach() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);

    // Report below-minimum temperature
    ctx.client.report_temperature(&ctx.oracle, &id, &100); // 1.0°C < min 2.0°C
    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.status, ShipmentStatus::Breached);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 11: Cannot confirm delivery after breach
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_cannot_confirm_after_breach() {
    let ctx = setup();
    let id = init_shipment(&ctx);
    ctx.client.deposit_bond(&ctx.logistics_provider, &id);
    ctx.client.report_temperature(&ctx.oracle, &id, &1000); // breach

    let result = ctx.client.try_confirm_delivery(&ctx.shipper, &id);
    assert_eq!(result, Err(Ok(ContractError::InvalidState)));
}

// ═══════════════════════════════════════════════════════════════════════
// TEST 12: Get shipment returns data correctly
// ═══════════════════════════════════════════════════════════════════════

#[test]
fn test_get_shipment_data() {
    let ctx = setup();
    let id = init_shipment(&ctx);

    let shipment = ctx.client.get_shipment(&id).unwrap();
    assert_eq!(shipment.min_temp, TEST_MIN_TEMP);
    assert_eq!(shipment.max_temp, TEST_MAX_TEMP);
    assert_eq!(shipment.bond_amount, TEST_BOND_AMOUNT);
    assert_eq!(shipment.shipper, ctx.shipper);
    assert_eq!(shipment.logistics_provider, ctx.logistics_provider);
    assert_eq!(shipment.oracle, ctx.oracle);
}
