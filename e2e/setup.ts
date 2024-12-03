import {
    BlockfrostProvider,
    MeshTxBuilder,
    MeshWallet,
    applyParamsToScript,
    resolveScriptHash,
    serializePlutusScript,
} from "@meshsdk/core";
import { builtinByteString, integer, outputReference, UTxO } from "@meshsdk/common";
import dotenv from "dotenv";
dotenv.config();
import blueprint from "../plutus.json" with { type: "json" };

// Setup blockhain provider as Blockfrost
const blockfrostId = process.env.BLOCKFROST_ID;
if (!blockfrostId) {
    throw new Error("BLOCKFROST_ID does not exist");
}
const blockchainProvider = new BlockfrostProvider(blockfrostId);

// import wallet passphrase and initialize the wallet
const wallet1Passphrase = process.env.WALLET_PASSPHRASE;
if (!wallet1Passphrase) {
    throw new Error("WALLET_PASSPHRASE does not exist");
}
const wallet1 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
        type: "mnemonic",
        words: wallet1Passphrase.split(' ')
    },
});

const wallet1Address = await wallet1.getChangeAddress();

const wallet1Utxos = await wallet1.getUtxos();
const wallet1Collateral: UTxO = (await wallet1.getCollateral())[0]
if (!wallet1Collateral) {
    throw new Error('No collateral utxo found');
}

const paramUtxo = outputReference("f591e09681e51a20c97f260f83735edecb1b20be624fe6ef5747a56d314601a7", 0);

// Fract NFT Validator
const fractNftValidator = blueprint.validators.filter((val) => val.title.includes('fract_nft.mint'));
if (!fractNftValidator) {
    throw new Error('Fract NFT Validator not found!');
}

const parameterizedScript = applyParamsToScript(
    fractNftValidator[0].compiledCode,
    [
        builtinByteString("b2af4d6208ee4114c74dc01b7111ba1df61a94a2d7d2fd7c473b139f"),
        builtinByteString("6f6e657369655f736369"),
        integer(120),
        integer(60),
        paramUtxo
    ],
    "JSON"
);

const scriptAddr = serializePlutusScript(
    { code: parameterizedScript, version: 'V3' },
    undefined,
    0
).address;
console.log('script address:', scriptAddr, '\n');

const fractPolicyId = resolveScriptHash(parameterizedScript, "V3");
console.log('fractPolicyId:', fractPolicyId);

// Create transaction builder
const txBuilder = new MeshTxBuilder({
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    verbose: false,
});
txBuilder.setNetwork('preprod');

export {
    blockchainProvider,
    txBuilder,
    parameterizedScript,
    scriptAddr,
    fractPolicyId,
    wallet1,
    wallet1Address,
    wallet1Utxos,
    wallet1Collateral,
}
