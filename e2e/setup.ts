import {
  applyParamsToScript,
  BlockfrostProvider,
  MaestroProvider,
  MeshTxBuilder,
  MeshWallet,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import {
  builtinByteString,
  integer,
  outputReference,
  UTxO,
} from "@meshsdk/common";
import dotenv from "dotenv";
dotenv.config();
import blueprint from "../plutus.json" with { type: "json" };
import refBlueprint from "../frontend/src/lib/ref/plutus.json" with { type: "json" }

// Setup blockhain provider as Blockfrost
// const blockfrostId = process.env.BLOCKFROST_ID;
// if (!blockfrostId) {
//   throw new Error("BLOCKFROST_ID does not exist");
// }
// const blockchainProvider = new BlockfrostProvider(blockfrostId);

// Setup blockhain provider as Maestro
const maestroKey = process.env.MAESTRO_KEY;
if (!maestroKey) {
  throw new Error("MAESTRO_KEY does not exist");
}
const maestroProvider = new MaestroProvider({
  network: "Preprod", // Mainnet / Preprod / Preview
  apiKey: maestroKey, // Get key at https://docs.gomaestro.org/
  turboSubmit: false, // Read about paid turbo transaction submission feature at https://docs.gomaestro.org
});

// import wallet passphrase and initialize the wallet
const wallet1Passphrase = process.env.WALLET_PASSPHRASE;
if (!wallet1Passphrase) {
  throw new Error("WALLET_PASSPHRASE does not exist");
}
const wallet1 = new MeshWallet({
  networkId: 0,
  fetcher: maestroProvider,
  submitter: maestroProvider,
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
  "088e36e5999a69521c4bae68b399cf799a111f0824a6fba773e815fb65b331dd",
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
      "cad3ae15ed1cfc018198ba091728384178c324d48892be56ac3c2e96",
    ),
    builtinByteString("66656e6978"),
    integer(120),
    integer(60),
    paramUtxo,
  ],
  "JSON",
);

// console.log('parameterizedScript:', parameterizedScript);
// 5904cf5904cc01010033333323232323232...

const scriptAddr = serializePlutusScript(
  { code: parameterizedScript, version: "V3" },
  undefined,
  0,
).address;
console.log("script address:", scriptAddr, "\n");

const fractPolicyId = resolveScriptHash(parameterizedScript, "V3");
console.log("fractPolicyId:", fractPolicyId);

// Ref script validator
const refScriptValidator = refBlueprint.validators.filter((val) =>
  val.title.includes("ref_script_val.spend")
);
if (!refScriptValidator) {
  throw new Error("Ref Script Validator not found!");
}
const refScriptValCode = applyParamsToScript(
  refScriptValidator[0].compiledCode,
  [],
  "JSON"
);
const refScriptValAddr = serializePlutusScript(
  { code: refScriptValCode, version: "V3" },
  undefined,
  0
).address;


// Create transaction builder
const txBuilder = new MeshTxBuilder({
  fetcher: maestroProvider,
  submitter: maestroProvider,
  verbose: false,
});
txBuilder.setNetwork("preprod");

export {
  fractPolicyId,
  parameterizedScript,
  scriptAddr,
  txBuilder,
  wallet1,
  wallet1Address,
  wallet1Collateral,
  wallet1Utxos,
  refScriptValAddr,
  maestroProvider,
};
