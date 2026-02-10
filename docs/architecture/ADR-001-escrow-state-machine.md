# ADR-001: Escrow State Machine & Storage Strategy
**Status:** ACCEPTED
**Author:** Architect Agent
**Date:** 2026-02-09
**Updated:** 2026-02-11

## Context
We are building a decentralized escrow system on Stellar (Soroban). We need a robust way to manage the state of funds to ensure they are locked and only released upon mutual consent.

## Decision
We will use a **Finite State Machine (FSM)** pattern implemented within a Soroban Smart Contract.

### 1. State Machine
The `Escrow` entity will track the following states:

| State | Description | Transitions |
| :--- | :--- | :--- |
| `Funded` | Initial state. Funds are held by the contract. | → `Released` (Mutual Approval)<br>→ `Cancelled` (Client Cancel)<br>→ `Disputed` (Either Party) |
| `Released` | Terminal state. Funds transferred to Freelancer. | None |
| `Cancelled` | Terminal state. Funds refunded to Client. | None |
| `Disputed` | Awaiting arbiter resolution. | → `Resolved` (Arbiter Decision) |
| `Resolved` | Terminal state. Funds awarded to winner by arbiter. | None |

**Logic Flow:**
1.  `deposit()` → Creates Escrow in `Funded` state.
2.  `approve(client)` → Sets `approved_by_client = true`. Checks mutual.
3.  `approve(freelancer)` → Sets `approved_by_freelancer = true`. Checks mutual.
4.  **Mutual Check**: If `approved_by_client && approved_by_freelancer` → Transfer Funds → Transition to `Released`.
5.  `cancel()` → Client-only, before freelancer approval → Refund → `Cancelled`.
6.  `dispute()` → Either party → `Disputed`.
7.  `resolve(winner)` → Arbiter-only → Transfer to winner → `Resolved`.

### 2. Storage Strategy
We will use **Persistent Storage** (`Env::storage().persistent()`) for Escrow entries.
-   **Key**: `u64` (Escrow ID) with `checked_add` for overflow safety.
-   **Value**: `Escrow` struct.
-   **TTL**: Persistent entries allow the escrow to live indefinitely (until rent is paid/expired), which is suitable for long-term jobs.
-   **Indexing**: `UserEscrows(Address)` maps users to their escrow IDs.

### 3. Data Structure
```rust
#[contracttype]
pub struct Escrow {
    pub client: Address,
    pub freelancer: Address,
    pub arbiter: Address,        // Trusted third party for disputes
    pub amount: i128,
    pub token: Address,          // Support generic tokens (SAC)
    pub approved_by_client: bool,
    pub approved_by_freelancer: bool,
    pub state: EscrowState,      // Funded | Released | Cancelled | Disputed | Resolved
}
```

## Consequences
-   **Positive**: Simple, clear audit trail. Persistent storage ensures data safety. Arbiter system prevents deadlocks.
-   **Negative**: Rent fees for persistent storage.
-   **Risks**: Arbiter collusion. *Mitigation*: Future multi-sig arbiter panels.

## Security Considerations
-   **Authorization**: strictly enforce `approver.require_auth()` on all state-changing functions.
-   **Token Safety**: Use `token::Client` to handle transfers securely.
-   **Overflow Protection**: Escrow ID uses `checked_add`.
