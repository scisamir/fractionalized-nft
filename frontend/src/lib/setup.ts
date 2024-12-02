import {
  applyParamsToScript,
  BlockfrostProvider,
  MeshTxBuilder,
  MeshWallet,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import { builtinByteString, integer, outputReference } from "@meshsdk/common";
import type { UTxO } from "@meshsdk/common";
import { env } from "$env/dynamic/public";

// import dotenv from "dotenv";
// dotenv.config();
import blueprint from "./plutus.json" with { type: "json" };

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

const wallet1Utxos = await wallet1.getUtxos();
const wallet1Collateral: UTxO = (await wallet1.getCollateral())[0];
if (!wallet1Collateral) {
  throw new Error("No collateral utxo found");
}

const paramUtxo = outputReference(
  "38874f1ad945dea28f95a00f169168625364c9ecfb072f5729efbfab2ec95768",
  0,
);

// Fract NFT Validator
const fractNftValidator = blueprint.validators.filter((val) =>
  val.title.includes("fract_nft.mint")
);
if (!fractNftValidator) {
  throw new Error("Fract NFT Validator not found!");
}

const parameterizedScript = applyParamsToScript(
  fractNftValidator[0].compiledCode,
  [
    builtinByteString(
      "b2af4d6208ee4114c74dc01b7111ba1df61a94a2d7d2fd7c473b139f",
    ),
    builtinByteString("6d795f6e6674"),
    integer(100),
    integer(50),
    paramUtxo,
  ],
  "JSON",
);

const scriptAddr = serializePlutusScript(
  { code: parameterizedScript, version: "V3" },
  undefined,
  0,
).address;
console.log("script address:", scriptAddr, "\n");
// script address: addr_test1wrhx7ceyv0jxnpfk9cq0zd6hajzy6gwd7qwurep0t4qytzcf4kyy4
// script address: addr_test1wrhx7ceyv0jxnpfk9cq0zd6hajzy6gwd7qwurep0t4qytzcf4kyy4

const fractPolicyId = resolveScriptHash(parameterizedScript, "V3");
console.log("fractPolicyId:", fractPolicyId);

// Create transaction builder
const txBuilder = new MeshTxBuilder({
  fetcher: blockchainProvider,
  submitter: blockchainProvider,
  verbose: false,
});
txBuilder.setNetwork("preprod");

export {
  blockchainProvider,
  fractPolicyId,
  parameterizedScript,
  scriptAddr,
  txBuilder,
  wallet1,
  wallet1Address,
  wallet1Collateral,
  wallet1Utxos,
};
