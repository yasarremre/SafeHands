import {
  rpc,
  TransactionBuilder,
  Networks,
  Contract,
  xdr,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import {
  isConnected,
  signTransaction,
  getAddress,
  setAllowed
} from "@stellar/freighter-api";

// TODO: Deploy contract and update this ID
export const CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const server = new rpc.Server(RPC_URL);

/**
 * Deposits funds to create a new escrow.
 * Corresponds to: fn deposit(env, client, freelancer, token, amount) -> u64
 */
export async function deposit(
  clientAddress: string,
  freelancerAddress: string,
  amount: string
) {
  const contract = new Contract(CONTRACT_ID);
  const NATIVE_TOKEN = "CDLZFC3SYJYDZT7KQLSZZQ754175QYYJ5PSQSRJCJRSH6JWWKAOW754O";

  console.log("Deposit args:", { clientAddress, freelancerAddress, NATIVE_TOKEN, amount });

  const args = [
    nativeToScVal(clientAddress),
    nativeToScVal(freelancerAddress),
    nativeToScVal(NATIVE_TOKEN),
    nativeToScVal(BigInt(amount), { type: "i128" }),
  ];

  const op = contract.call("deposit", ...args);

  return await submitTx(clientAddress, op);
}

/**
 * Approves the release of funds.
 * Corresponds to: fn approve(env, approver, escrow_id)
 */
export async function approve(
  approverAddress: string,
  escrowId: string
) {
  const contract = new Contract(CONTRACT_ID);

  const args = [
    nativeToScVal(approverAddress),
    nativeToScVal(BigInt(escrowId), { type: "u64" }),
  ];

  const op = contract.call("approve", ...args);

  return await submitTx(approverAddress, op);
}

// Helper to sign and submit
async function submitTx(sourceAddress: string, operation: xdr.Operation) {
  const account = await server.getAccount(sourceAddress);

  const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(operation)
    .setTimeout(30)
    .build();

  const signedTx = await signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE });

  if (signedTx.error) {
    throw new Error(signedTx.error);
  }

  // Debug logging
  console.log("Signed XDR:", signedTx.signedTxXdr);
  console.log("Passphrase:", NETWORK_PASSPHRASE);

  const txFromXDR = TransactionBuilder.fromXDR(signedTx.signedTxXdr, NETWORK_PASSPHRASE);

  const response = await server.sendTransaction(txFromXDR);

  if (response.status !== "PENDING" && response.status !== "DUPLICATE" && response.status !== "SUCCESS") {
    console.error("Transaction failed details:", response);
    throw new Error(`Transaction failed with status: ${response.status}`);
  }

  return response;
}
