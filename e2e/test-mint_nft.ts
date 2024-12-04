import {
  applyParamsToScript,
  mConStr0,
  resolveScriptHash,
  stringToHex,
} from "@meshsdk/core";
import mintNftBlueprint from "../test-mint_nft_onchain/plutus.json" with {
  type: "json",
};
import {
  txBuilder,
  wallet1,
  wallet1Address,
  wallet1Collateral,
  wallet1Utxos,
} from "./setup.js";

// mint_nft Validator
const mintNftValidator = mintNftBlueprint.validators.filter((val) =>
  val.title.includes("mint_nft.mint")
);
if (!mintNftValidator) {
  throw new Error("Mint NFT Validator not found!");
}

const validatorScript = applyParamsToScript(
  mintNftValidator[0].compiledCode,
  [],
);

const policyId = resolveScriptHash(validatorScript, "V3");

const tokenName = "test_test";
const tokenNameHex = stringToHex(tokenName);

const unsignedTx = await txBuilder
  .mintPlutusScriptV3()
  .mint("1", policyId, tokenNameHex)
  .mintingScript(validatorScript)
  .mintRedeemerValue(mConStr0([]))
  .changeAddress(wallet1Address)
  .selectUtxosFrom(wallet1Utxos)
  .txInCollateral(
    wallet1Collateral.input.txHash,
    wallet1Collateral.input.outputIndex,
    wallet1Collateral.output.amount,
    wallet1Collateral.output.address,
  )
  .complete();

const signedTx = await wallet1.signTx(unsignedTx);
const txHash = await wallet1.submitTx(signedTx);

console.log("my_nft minted tx hash:", txHash);
