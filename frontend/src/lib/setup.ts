import {
  applyParamsToScript,
  BlockfrostProvider,
  MaestroProvider,
  MeshTxBuilder,
  MeshWallet,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import type { UTxO } from "@meshsdk/common";
import { env } from "$env/dynamic/public";
import { BrowserWalletState } from "./state/browser-wallet-state.svelte.ts";

// import dotenv from "dotenv";
// dotenv.config();

// Setup blockhain provider as Blockfrost
const blockfrostId = env.PUBLIC_BLOCKFROST_ID;
if (!blockfrostId) {
  throw new Error("BLOCKFROST_ID does not exist");
}
const blockchainProvider = new BlockfrostProvider(blockfrostId);

// import wallet passphrase and initialize the wallet
const wallet1Passphrase = env.PUBLIC_WALLET_PASSPHRASE;
if (!wallet1Passphrase) {
  throw new Error("WALLET_PASSPHRASE does not exist");
}
let wallet1: MeshWallet;

// Create transaction builder
const txBuilder = new MeshTxBuilder({
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  verbose: true,
});

const maestroProvider = new MaestroProvider({
  network: "Preprod", // Mainnet / Preprod / Preview
  apiKey: env.PUBLIC_MAESTRO_ID, // Get key at https://docs.gomaestro.org/
  turboSubmit: false, // Read about paid turbo transaction submission feature at https://docs.gomaestro.org
});

txBuilder.setNetwork("preprod");

async function getUtxos() {
  return await wallet1.getUtxos();
}
async function getCollateral() {
  return (await wallet1.getCollateral())[0];
}

function initWallet(wallet: MeshWallet) {
  wallet1 = wallet;
}

async function getAddress() {
  return await wallet1.getChangeAddress();
}

export {
  blockchainProvider,
  getAddress,
  getCollateral,
  getUtxos,
  initWallet,
  maestroProvider,
  txBuilder,
};
