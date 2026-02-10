#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    // Deposit (with Arbiter)
    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &100_i128);
    
    // Verify State
    let escrow = client.get_escrow(&id);
    assert_eq!(escrow.amount, 100_i128);
    assert_eq!(escrow.state, EscrowState::Funded);

    // Verify Indexing
    let user_a_escrows = client.get_user_escrows(&user_a);
    assert_eq!(user_a_escrows.len(), 1);
    assert_eq!(user_a_escrows.get(0).unwrap(), id);

    // Approve A
    client.approve(&user_a, &id);
    
    // Approve B
    client.approve(&user_b, &id);

    // Verify Release
    let escrow_updated = client.get_escrow(&id);
    assert_eq!(escrow_updated.state, EscrowState::Released);
    
    assert_eq!(token.balance(&user_b), 100_i128);
}

#[test]
fn test_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    // Deposit
    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &500_i128);

    // Cancel (Before Freelancer approves)
    client.cancel(&user_a, &id);

    // Verify Refund
    assert_eq!(token.balance(&user_a), 1000_i128); // Original balance
    
    let escrow = client.get_escrow(&id);
    assert_eq!(escrow.state, EscrowState::Cancelled);
}

#[test]
fn test_dispute_resolution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token = token::Client::new(&env, &token_contract);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env); // Client
    let user_b = Address::generate(&env); // Freelancer
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    // Deposit
    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &500_i128);

    // Raise Dispute (Client unhappy)
    client.dispute(&user_a, &id);

    let escrow = client.get_escrow(&id);
    assert_eq!(escrow.state, EscrowState::Disputed);

    // Arbiter resolves in favor of Client
    client.resolve(&arbiter, &id, &user_a);

    // Returns to client
    assert_eq!(token.balance(&user_a), 1000_i128);
    
    let escrow_resolved = client.get_escrow(&id);
    assert_eq!(escrow_resolved.state, EscrowState::Resolved);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_zero_amount_deposit() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    // Deposit 0 should fail
    client.deposit(&user_a, &user_b, &arbiter, &token_contract, &0_i128);
}

#[test]
fn test_double_approval_client() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &100_i128);

    // Client approves twice - second should be idempotent
    client.approve(&user_a, &id);
    client.approve(&user_a, &id);

    let escrow = client.get_escrow(&id);
    assert_eq!(escrow.approved_by_client, true);
    assert_eq!(escrow.state, EscrowState::Funded); // Not released since freelancer didn't approve
}

#[test]
#[should_panic(expected = "Only client can cancel")]
fn test_unauthorized_cancel() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &100_i128);

    // Freelancer tries to cancel - should fail
    client.cancel(&user_b, &id);
}

#[test]
#[should_panic(expected = "Cannot cancel: Freelancer has already accepted/approved")]
fn test_cancel_after_freelancer_approval() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &100_i128);

    // Freelancer approves first
    client.approve(&user_b, &id);

    // Client tries to cancel after freelancer approved - should fail
    client.cancel(&user_a, &id);
}

#[test]
#[should_panic(expected = "Not the authorized arbiter")]
fn test_unauthorized_resolve() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, SafeHandsContract);
    let client = SafeHandsContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract_v2(token_admin).address();
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract);

    let user_a = Address::generate(&env);
    let user_b = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let random = Address::generate(&env);

    token_admin_client.mint(&user_a, &1000_i128);

    let id = client.deposit(&user_a, &user_b, &arbiter, &token_contract, &100_i128);

    // Dispute first
    client.dispute(&user_a, &id);

    // Random address (not arbiter) tries to resolve - should fail
    client.resolve(&random, &id, &user_a);
}

