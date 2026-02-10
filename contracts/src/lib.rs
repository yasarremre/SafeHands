#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, symbol_short, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Funded = 0,
    Released = 1,
    Cancelled = 2,
    Disputed = 3,
    Resolved = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub arbiter: Address, // New: Arbiter for disputes
    pub amount: i128,
    pub token: Address,
    pub approved_by_client: bool,
    pub approved_by_freelancer: bool,
    pub state: EscrowState,
}

#[contracttype]
pub enum DataKey {
    NextEscrowId,
    Escrow(u64), // Key for specific escrow
    UserEscrows(Address), // Key for user's list of escrow IDs
}

#[contract]
pub struct SafeHandsContract;

#[contractimpl]
impl SafeHandsContract {

    pub fn deposit(
        env: Env,
        client: Address,
        freelancer: Address,
        arbiter: Address,
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
            arbiter: arbiter.clone(),
            amount,
            token,
            approved_by_client: false,
            approved_by_freelancer: false,
            state: EscrowState::Funded,
        };

        // Store Escrow
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);
        
        // Update Indexes
        Self::add_escrow_to_user(&env, client.clone(), escrow_id);
        Self::add_escrow_to_user(&env, freelancer.clone(), escrow_id);
        
        // Increment ID
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

        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        if escrow.state != EscrowState::Funded && escrow.state != EscrowState::Disputed {
            panic!("Escrow not in a state to be approved");
        }

        if approver == escrow.client {
            escrow.approved_by_client = true;
        } else if approver == escrow.freelancer {
            escrow.approved_by_freelancer = true;
        } else {
            panic!("Not authorized to approve");
        }

        // Check for Release condition (Both approved)
        if escrow.approved_by_client && escrow.approved_by_freelancer {
            let token_client = token::Client::new(&env, &escrow.token);
            token_client.transfer(
                &env.current_contract_address(),
                &escrow.freelancer,
                &escrow.amount,
            );
            escrow.state = EscrowState::Released;

            env.events().publish(
                (symbol_short!("release"), escrow.client.clone(), escrow.freelancer.clone()),
                (escrow_id, escrow.amount),
            );
        }

        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);
    }

    pub fn cancel(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);
        
        // Cancel Logic: 
        // 1. Only Client can cancel.
        // 2. Only if Freelancer hasn't approved (started) yet.
        // 3. Only if State is Funded.

        if caller != escrow.client {
             panic!("Only client can cancel");
        }

        if escrow.state != EscrowState::Funded {
             panic!("Escrow cannot be cancelled in current state");
        }

        if escrow.approved_by_freelancer {
             panic!("Cannot cancel: Freelancer has already accepted/approved");
        }

        // Refund
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.client,
            &escrow.amount,
        );
        
        escrow.state = EscrowState::Cancelled;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("cancel"), escrow.client.clone()),
            (escrow_id, escrow.amount),
        );
    }

    pub fn dispute(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        if caller != escrow.client && caller != escrow.freelancer {
             panic!("Only parties can raise dispute");
        }

        if escrow.state != EscrowState::Funded {
             panic!("Can only dispute active/funded escrows");
        }

        escrow.state = EscrowState::Disputed;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("dispute"), caller),
            (escrow_id),
        );
    }

    pub fn resolve(env: Env, arbiter: Address, escrow_id: u64, winner: Address) {
        arbiter.require_auth();
        let mut escrow = Self::get_escrow(env.clone(), escrow_id);

        if arbiter != escrow.arbiter {
             panic!("Not the authorized arbiter");
        }

        if escrow.state != EscrowState::Disputed && escrow.state != EscrowState::Funded {
             panic!("Escrow not in a state to be resolved");
        }

        if winner != escrow.client && winner != escrow.freelancer {
             panic!("Winner must be one of the parties");
        }

        // Transfer full amount to winner
        let token_client = token::Client::new(&env, &escrow.token);
        token_client.transfer(
            &env.current_contract_address(),
            &winner,
            &escrow.amount,
        );
        
        escrow.state = EscrowState::Resolved;
        env.storage().persistent().set(&DataKey::Escrow(escrow_id), &escrow);

        env.events().publish(
            (symbol_short!("resolve"), arbiter, winner),
            (escrow_id, escrow.amount),
        );
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> Escrow {
        env.storage().persistent().get(&DataKey::Escrow(escrow_id)).expect("Escrow does not exist")
    }

    pub fn get_user_escrows(env: Env, user: Address) -> Vec<u64> {
        env.storage().persistent().get(&DataKey::UserEscrows(user)).unwrap_or(Vec::new(&env))
    }

    // Helpers

    fn get_next_escrow_id(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::NextEscrowId).unwrap_or(0)
    }

    fn add_escrow_to_user(env: &Env, user: Address, escrow_id: u64) {
        let key = DataKey::UserEscrows(user.clone());
        let mut list: Vec<u64> = env.storage().persistent().get(&key).unwrap_or(Vec::new(env));
        list.push_back(escrow_id);
        env.storage().persistent().set(&key, &list);
    }
}

mod test;
