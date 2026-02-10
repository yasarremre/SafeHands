import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  xdr,
  nativeToScVal,
  scValToNative,
  Address,
  Asset,
  Account,
} from "@stellar/stellar-sdk";
import {
  signTransaction,
} from "@stellar/freighter-api";
import toast from "react-hot-toast";

// TODO: Deploy contract and update this ID
export const CONTRACT_ID = "CDYN4KMSDSTAFIEMXKVNWDT2DK3JGVHC242NWOPVPBFMCXA2OX5LI52K";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

// EscrowState enum mapping:
// 0: Funded, 1: Released, 2: Cancelled, 3: Disputed, 4: Resolved

export async function deposit(
  clientAddress: string,
  freelancerAddress: string,
  arbiterAddress: string,
  amount: string,
  deadlineDays: number = 30
) {
  const contract = new Contract(CONTRACT_ID);
  // Derive Native Token ID dynamically (Wrapped XLM for Soroban)
  const root = Asset.native();
  const NATIVE_TOKEN = root.contractId(NETWORK_PASSPHRASE);

  const args = [
    new Address(clientAddress).toScVal(),
    new Address(freelancerAddress).toScVal(),
    new Address(arbiterAddress).toScVal(),
    new Address(NATIVE_TOKEN).toScVal(),
    nativeToScVal(BigInt(amount), { type: "i128" }),
    nativeToScVal(BigInt(deadlineDays), { type: "u64" }),
  ];

  const op = contract.call("deposit", ...args);

  return await submitTx(clientAddress, op);
}

export async function claimTimeout(escrowId: string, callerAddress: string) {
  const contract = new Contract(CONTRACT_ID);
  const args = [
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
  ];
  const op = contract.call("claim_timeout", ...args);
  return await submitTx(callerAddress, op);
}

export async function approve(
  approverAddress: string,
  escrowId: string
) {
  const contract = new Contract(CONTRACT_ID);

  const args = [
    new Address(approverAddress).toScVal(),
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
  ];

  const op = contract.call("approve", ...args);

  return await submitTx(approverAddress, op);
}

export async function cancel(
  clientAddress: string,
  escrowId: string
) {
  const contract = new Contract(CONTRACT_ID);

  const args = [
    new Address(clientAddress).toScVal(),
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
  ];

  const op = contract.call("cancel", ...args);

  return await submitTx(clientAddress, op);
}

export async function dispute(
  callerAddress: string,
  escrowId: string
) {
  const contract = new Contract(CONTRACT_ID);

  const args = [
    new Address(callerAddress).toScVal(),
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
  ];

  const op = contract.call("dispute", ...args);

  return await submitTx(callerAddress, op);
}

export async function resolve(
  arbiterAddress: string,
  escrowId: string,
  winnerAddress: string
) {
  const contract = new Contract(CONTRACT_ID);

  const args = [
    new Address(arbiterAddress).toScVal(),
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
    new Address(winnerAddress).toScVal(),
  ];

  const op = contract.call("resolve", ...args);

  return await submitTx(arbiterAddress, op);
}

// Helper to clean up BigInts for JSON/Display
function sanitizeScVal(val: unknown): unknown {
  if (typeof val === 'bigint') {
    return val.toString();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeScVal);
  }
  if (val && typeof val === 'object') {
    if ((val as { constructor?: { name?: string } }).constructor?.name === 'Address') {
      return val.toString();
    }
    // Handle generic objects (structs)
    const out: Record<string, unknown> = {};
    for (const k in val) {
      out[k] = sanitizeScVal((val as Record<string, unknown>)[k]);
    }
    return out;
  }
  return val;
}

export async function getEscrow(escrowId: string, userAddress?: string) {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call("get_escrow", nativeToScVal(BigInt(escrowId), { type: "u64" }));

  // Use user's address if available, otherwise a dummy G-address for simulation
  const SIM_SOURCE = userAddress || "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

  // We use a random account or the user's account. 
  // catch() handles cases where account doesn't exist on network (e.g. local testnet reset), 
  // returning a mock Account object with sequence "0" is enough for simulation.
  const source = await server.getAccount(SIM_SOURCE).catch(() => new Account(SIM_SOURCE, "0"));

  const tx = new TransactionBuilder(source, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simulation)) {
    // @ts-expect-error - simulation result structure varies by SDK version
    const retval = simulation.result ? simulation.result.retval : simulation.results[0].retval;
    const raw = scValToNative(retval);
    return sanitizeScVal(raw);
  }
  return null;
}

export async function getUserEscrows(userAddress: string) {
  const contract = new Contract(CONTRACT_ID);
  const op = contract.call("get_user_escrows", new Address(userAddress).toScVal()); // Updated to correct Address format
  // Use user's address for simulation auth
  const account = await server.getAccount(userAddress).catch(() => new Account(userAddress, "0"));
  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simulation = await server.simulateTransaction(tx);

  if (rpc.Api.isSimulationSuccess(simulation)) {
    // @ts-expect-error - simulation result structure varies by SDK version
    const retval = simulation.result ? simulation.result.retval : simulation.results[0].retval;
    const raw = scValToNative(retval);
    const list = sanitizeScVal(raw) as unknown[];
    // Deduplicate
    return Array.from(new Set(list));
  }
  return [];
}


// Helper to sign, submit, and POLL for transaction result
async function submitTx(sourceAddress: string, operation: xdr.Operation) {
  const account = await server.getAccount(sourceAddress);

  let tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  // IMPORTANT: Simulate and Prepare the transaction (calculate fees & auth)
  tx = await server.prepareTransaction(tx);

  const signedTx = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });

  if (signedTx.error) {
    throw new Error(signedTx.error);
  }

  // Debug logging
  console.log("Signed XDR:", signedTx.signedTxXdr);
  console.log("Passphrase:", NETWORK_PASSPHRASE);

  const txFromXDR = TransactionBuilder.fromXDR(signedTx.signedTxXdr, NETWORK_PASSPHRASE);

  const response = await server.sendTransaction(txFromXDR);

  if (response.status === "ERROR") {
    console.error("Transaction failed details:", response);
    throw new Error(`Transaction failed with status: ${response.status}`);
  }

  // Poll for transaction result (max 30s, every 2s)
  const txHash = response.hash;
  const pollResult = toast.promise(
    pollTransaction(txHash),
    {
      loading: "⏳ Confirming on Stellar...",
      success: "✅ Transaction confirmed!",
      error: "❌ Transaction failed on-chain",
    }
  );

  return await pollResult;
}

async function pollTransaction(txHash: string, maxAttempts = 15): Promise<rpc.Api.GetTransactionResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result = await server.getTransaction(txHash);

    if (result.status === "SUCCESS") {
      return result;
    }
    if (result.status === "FAILED") {
      throw new Error("Transaction failed on-chain. Check Stellar Explorer for details.");
    }
    // status === "NOT_FOUND" means still pending, keep polling
  }
  throw new Error("Transaction timed out after 30 seconds. It may still succeed — check Stellar Explorer.");
}
