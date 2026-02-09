# ADR-001: Escrow State Machine & Storage Strategy
**Status:** PROPOSED
**Author:** Architect Agent
**Date:** 2026-02-09

## Context
We are building a decentralized escrow system on Stellar (Soroban). We need a robust way to manage the state of funds to ensure they are locked and only released upon mutual consent.

## Decision
We will use a **Finite State Machine (FSM)** pattern implemented within a Soroban Smart Contract.

### 1. State Machine
The `Escrow` entity will track the following states:

| State | Description | Transitions |
| :--- | :--- | :--- |
| `Funded` | Initial state. Funds are held by the contract. | -> `Released` (Mutual Approval)<br>-> `Disputed` (Future Feature) |
| `Released` | Terminal state. Funds have been transferred to Freelancer. | None |

**Logic Flow:**
1.  `deposit()` -> Creates Escrow in `Funded` state.
2.  `approve(client)` -> Sets `approved_by_client = true`. Checks mutual.
3.  `approve(freelancer)` -> Sets `approved_by_freelancer = true`. Checks mutual.
4.  **Mutual Check**: If `approved_by_client && approved_by_freelancer` -> Transfer Funds -> Transition to `Released`.

### 2. Storage Strategy
We will use **Persistent Storage** (`Env::storage().persistent()`) for Escrow entries.
-   **Key**: `u64` (Escrow ID).
-   **Value**: `Escrow` struct.
-   **TTL**: Persistent entries allow the escrow to live indefinitely (until rent is paid/expired), which is suitable for long-term jobs.

### 3. Data Structure
```rust
#[contracttype]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub token: Address,         // Support generic tokens (SAC)
    pub approved_by_client: bool,
    pub approved_by_freelancer: bool,
    pub state: EscrowState,
}
```

## Consequences
-   **Positive**: Simple, clear audit trail. Persistent storage ensures data safety.
-   **Negative**: Rent fees for persistent storage.
-   **Risks**: Both parties refusing to approve (deadlock). *Mitigation*: Future arbitration/timeout logic (out of scope for MVP).

## Security Considerations
-   **Authorization**: strictly enforce `approver.require_auth()`.
-   **Token Safety**: Use `token::Client` to handle transfers securely.
