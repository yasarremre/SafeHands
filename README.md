# SafeHands — Trustless Escrow on Stellar

**SafeHands** is a decentralized escrow application built on the **Stellar Network** using **Soroban Smart Contracts**. It solves trust issues between freelancers and clients by locking funds until mutual approval is granted.

## 🚀 Features

- **Secure Deposits**: Clients deposit XLM into a smart contract, locking the funds.
- **Mutual Approval**: Funds are only released when both the Client and Freelancer approve the work.
- **Cancel & Refund**: Client can cancel and get a refund before the freelancer starts.
- **Dispute Resolution**: Either party can raise a dispute; a designated Arbiter resolves it.
- **Arbiter System**: A trusted third party can be assigned to mediate disputes.
- **Trustless**: No middleman required. The smart contract enforces the agreement.
- **Modern UI**: A brutalist, high-contrast design optimized for clarity.

## 🛠 Tech Stack

- **Smart Contract**: Rust, Soroban SDK v21
- **Frontend**: Next.js 16, TypeScript, Tailwind CSS v4
- **Wallet**: Freighter Wallet
- **Network**: Stellar Testnet

## 📂 Project Structure

```
.
├── contracts/              # Soroban Smart Contract (Rust)
│   ├── src/
│   │   ├── lib.rs          # Contract Logic (6 public functions)
│   │   └── test.rs         # Unit Tests (8 tests)
│   ├── Cargo.toml          # Contract Dependencies
│   └── test_snapshots/     # Soroban test snapshots
├── frontend/               # Next.js Application
│   ├── app/                # App Router Pages
│   ├── components/         # UI Components
│   │   ├── CreateEscrowForm.tsx
│   │   ├── EscrowCard.tsx
│   │   ├── EscrowList.tsx
│   │   └── FreighterConnect.tsx
│   └── utils/
│       └── soroban.ts      # Soroban Interaction Utilities
├── docs/                   # Documentation
│   ├── USER_GUIDE.md       # Manual Test Guide (Turkish)
│   ├── architecture/       # Architecture Decision Records
│   └── design/             # Design System Documentation
├── scripts/                # Utility scripts
├── deploy_contract.ps1     # Deployment script (Windows)
└── contract_id.txt         # Deployed contract reference
```

## ⚡ Getting Started

### Prerequisites

1. **Rust & Soroban CLI**: Ensure you have a working Rust environment and `soroban-cli` installed.
2. **Node.js**: Version 18+ recommended.
3. **Freighter Wallet**: Browser extension installed and set to **Testnet**.

### 1. Build and Test the Smart Contract

Navigate to the `contracts` directory:

```bash
cd contracts
cargo test
```

To build the WASM file:

```bash
cargo build --target wasm32-unknown-unknown --release
```

**Note for Windows Users**: Ensure you have the Visual Studio Build Tools (C++ workload) installed for `cargo` to compile correctly.

### 2. Deploy the Contract

Use the provided deployment script:

```powershell
.\deploy_contract.ps1
```

This will build, deploy to Testnet, and output the Contract ID. Update `frontend/utils/soroban.ts` with the new Contract ID.

**Current Deployed Contract ID**: See `contract_id.txt`

### 3. Run the Frontend

Navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Smart Contract Logic

The contract (`contracts/src/lib.rs`) implements a Finite State Machine for escrow management:

### States
| State | Description |
|:------|:------------|
| `Funded` | Initial state — funds are locked in the contract |
| `Released` | Terminal — funds transferred to freelancer (mutual approval) |
| `Cancelled` | Terminal — funds refunded to client |
| `Disputed` | Active — awaiting arbiter resolution |
| `Resolved` | Terminal — arbiter awarded funds to the winner |

### Functions
1. `deposit(client, freelancer, arbiter, token, amount)` → Locks funds, returns escrow ID.
2. `approve(approver, escrow_id)` → Sets approval flag. Auto-releases if both approve.
3. `cancel(caller, escrow_id)` → Client-only refund (before freelancer approval).
4. `dispute(caller, escrow_id)` → Either party raises a dispute.
5. `resolve(arbiter, escrow_id, winner)` → Arbiter awards funds to winner.
6. `get_escrow(escrow_id)` → Read escrow details.
7. `get_user_escrows(user)` → List escrow IDs for a user.

## 🧪 Tests

The contract includes 8 unit tests covering:
- ✅ Happy path: Deposit → Approve → Release
- ✅ Cancel flow: Deposit → Cancel → Refund
- ✅ Dispute flow: Deposit → Dispute → Arbiter Resolve
- ✅ Edge cases: Zero amount, double approval, unauthorized cancel, unauthorized resolve

Run tests:
```bash
cd contracts && cargo test
```

## 🏗 Architecture

See [ADR-001: Escrow State Machine](docs/architecture/ADR-001-escrow-state-machine.md) for the architectural decision record.

## 🎨 Design

The UI follows a **Neo-Brutalist** design system. See [Design System](docs/design/design-system.md) for details.

## ⚠️ Disclaimer

This project is for **educational purposes** on the Stellar Testnet. Do not use with real funds on Mainnet without a professional security audit.
