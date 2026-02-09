import { rpc, Contract, Networks } from "@stellar/stellar-sdk";

const CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"; // Placeholder
const RPC_URL = "https://soroban-testnet.stellar.org";
const server = new rpc.Server(RPC_URL);

async function checkContract() {
    console.log("🔍 QA Agent: Starting Verification...");
    console.log(`📡 Connected to: ${RPC_URL}`);
    console.log(`📝 Checking Contract ID: ${CONTRACT_ID}`);

    try {
        // Try to fetch the latest ledger to confirm network connection
        const latestLedger = await server.getLatestLedger();
        console.log(`✅ QA Pass: Network Active. Latest Ledger: ${latestLedger.sequence}`);

        // Try to get contract instance (will fail if not deployed)
        try {
            // There isn't a direct "check if exists" in simple SDK without calling it or checking ledger entry
            // We can try to load the contract code or just assume if we can query it
            // For now, prompt the user.
            console.log("⚠️ QA Warning: Contract ID is a placeholder.");
            console.log("ℹ️  Action Required: Deploy contract using `soroban contract deploy`.");
            console.log("❌ QA Fail: Contract not live on Testnet.");
        } catch (innerE) {
            console.log("❌ QA Fail: Contract query failed.");
        }

    } catch (e) {
        console.error("❌ QA Critical Error: Network connection failed.", e.message);
    }
}

checkContract();
