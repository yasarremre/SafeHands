#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, symbol_short};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Funded = 0,
    Released = 1,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub token: Address,
    pub approved_by_client: bool,
    pub approved_by_freelancer: bool,
    pub state: EscrowState,
}

#[contract]
pub struct SafeHandsContract;

#[contractimpl]
impl SafeHandsContract {
    // Initialize is not strictly needed if we don't have global config, 
    // but useful if we wanted to set an admin or fee structure.
    // For this MVP, we rely on per-escrow storage.

    pub fn deposit(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) -> u64 {
        client.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        // Transfer funds to contract
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(
            &client,
            &env.current_contract_address(),
            &amount,
        );

        // Generate ID
        let escrow_id = Self::get_next_escrow_id(&env);

        let escrow = Escrow {
            client: client.clone(),
            freelancer: freelancer.clone(),
            amount,
            token,
            approved_by_client: false,
            approved_by_freelancer: false,
            state: EscrowState::Funded,
        };

        // Store
        env.storage().persistent().set(&escrow_id, &escrow);
        
        // Increment ID with overflow protection
        let next_id = escrow_id.checked_add(1).expect("Escrow ID limit reached");
        env.storage().instance().set(&DataKey::NextEscrowId, &next_id);

        // Emit Event
        env.events().publish(
            (symbol_short!("deposit"), client, freelancer),
            (escrow_id, amount),
        );

        escrow_id
    }

    pub fn approve(env: Env, approver: Address, escrow_id: u64) {
        approver.require_auth();

        let mut escrow: Escrow = env
            .storage()
            .persistent()
            .get(&escrow_id)
            .expect("Escrow not found");

        if escrow.state == EscrowState::Released {
            panic!("Escrow already released");
        }

        if approver == escrow.client {
            escrow.approved_by_client = true;
        } else if approver == escrow.freelancer {
            escrow.approved_by_freelancer = true;
        } else {
            panic!("Not authorized to approve");
        }

        // Mutual Approval Check
        if escrow.approved_by_client && escrow.approved_by_freelancer {
            let token_client = token::Client::new(&env, &escrow.token);
            token_client.transfer(
                &env.current_contract_address(),
                &escrow.freelancer,
                &escrow.amount,
            );
            escrow.state = EscrowState::Released;

            // Emit Event
            env.events().publish(
                (symbol_short!("release"), escrow.client.clone(), escrow.freelancer.clone()),
                (escrow_id, escrow.amount),
            );
        }

        env.storage().persistent().set(&escrow_id, &escrow);
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        env.storage().persistent().get(&escrow_id).expect("Escrow does not exist")
    }

    fn get_next_escrow_id(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::NextEscrowId).unwrap_or(0)
    }
}

#[contracttype]
pub enum DataKey {
    NextEscrowId,
}

mod test;
