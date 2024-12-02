import {
  applyParamsToScript,
  BlockfrostProvider,
  MeshTxBuilder,
  MeshWallet,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import type { UTxO } from "@meshsdk/common";
import { env } from "$env/dynamic/public";

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
const wallet1 = new MeshWallet({
  networkId: 0,
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  key: {
    type: "mnemonic",
    words: wallet1Passphrase.split(" "),
  },
});

const wallet1Address = await wallet1.getChangeAddress();
console.log("addy: " + wallet1Address);

const wallet1Utxos = await wallet1.getUtxos();
const wallet1Collateral: UTxO = (await wallet1.getCollateral())[0];
if (!wallet1Collateral) {
  throw new Error("No collateral utxo found");
}

// Create transaction builder
const txBuilder = new MeshTxBuilder({
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  verbose: false,
});
txBuilder.setNetwork("preprod");

export {
  blockchainProvider,
  txBuilder,
  wallet1,
  wallet1Address,
  wallet1Collateral,
  wallet1Utxos,
};
