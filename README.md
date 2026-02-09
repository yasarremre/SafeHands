# Freelance Safe-Hands

**Freelance Safe-Hands** is a decentralized escrow application built on the **Stellar Network** using **Soroban Smart Contracts**. It solves trust issues between freelancers and clients by locking funds until mutual approval is granted.

## 🚀 Features

- **Secure Deposits**: Clients deposit XLM into a smart contract, locking the funds.
- **Mutual Approval**: Funds are only released when both the Client and Freelancer approve the work.
- **Trustless**: No middleman required. The code enforces the agreement.
- **Modern UI**: A brutalist, high-contrast design optimized for clarity.

## 🛠 Tech Stack

- **Smart Contract**: Rust, Soroban SDK
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Wallet**: Freighter Wallet

## 📂 Project Structure

```
.
├── contracts/          # Soroban Smart Contract (Rust)
│   ├── src/lib.rs      # Contract Logic
│   └── Cargo.toml      # Contract Dependencies
└── frontend/           # Next.js Application
    ├── app/            # App Router Pages
    ├── components/     # UI Components
    └── utils/          # Soroban Interaction Utilities
```

## ⚡ Getting Started

### Prerequisites

1.  **Rust & Soroban CLI**: Ensure you have a working Rust environment and `soroban-cli` installed.
2.  **Node.js**: Version 18+ recommended.
3.  **Freighter Wallet**: Browser extension installed.

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

### 2. Run the Frontend

Navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Smart Contract Logic

The contract (`contracts/src/lib.rs`) manages the `Escrow` state:
1.  `deposit(client, freelancer, amount)`: Locks funds.
2.  `approve(approver)`: Sets approval flag. Checks if `client_approved && freelancer_approved`.
3.  `release()`: Transfers funds to the freelancer.

## ⚠️ Disclaimer

This project is for **educational purposes** on the Stellar Testnet. Do not use with real funds on Mainnet without a professional security audit.
