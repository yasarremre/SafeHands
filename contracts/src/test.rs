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

    token_admin_client.mint(&user_a, &1000_i128);

    // Deposit
    let id = client.deposit(&user_a, &user_b, &token_contract, &100_i128);
    
    // Verify State
    let escrow = client.get_escrow(&id);
    assert_eq!(escrow.amount, 100_i128);
    assert_eq!(escrow.state, EscrowState::Funded);

    // Approve A
    client.approve(&user_a, &id);
    
    // Approve B
    client.approve(&user_b, &id);

    // Verify Release
    let escrow_updated = client.get_escrow(&id);
    assert_eq!(escrow_updated.state, EscrowState::Released);
    
    assert_eq!(token.balance(&user_b), 100_i128);
}
