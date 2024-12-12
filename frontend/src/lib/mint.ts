import { mConStr0, stringToHex } from "@meshsdk/core";
import {
  blockchainProvider,
  getAddress,
  getCollateral,
  getUtxos,
  initWallet,
  txBuilder,
} from "./setup.ts";

import refBlueprint from "./ref/plutus.json" with { type: "json" };
import blueprint from "./plutus.json" with { type: "json" };
import { builtinByteString, integer, outputReference } from "@meshsdk/common";
import type { UTxO } from "@meshsdk/common";

import {
  applyParamsToScript,
  BlockfrostProvider,
  MeshTxBuilder,
  MeshWallet,
  resolveScriptHash,
  serializePlutusScript,
} from "@meshsdk/core";
import { BrowserWalletState } from "./state/browser-wallet-state.svelte.ts";

export async function mint(
  policy: string,
  tokenName: string,
  amountM: number,
  amountN: number,
) {
  const tokenNameHex = stringToHex(tokenName);
  if (BrowserWalletState.wallet == undefined) {
    return;
  }

  const utxos = await BrowserWalletState.wallet.getUtxos();
  let lockAssetUtxo: UTxO;

  utxos.forEach((e: UTxO) => {
    e.output.amount.forEach((asset: any) => {
      if (asset.unit == policy + tokenNameHex) {
        lockAssetUtxo = e;
      }
    });
  });

  const paramUtxo = outputReference(
    lockAssetUtxo.input.txHash,
    lockAssetUtxo.input.outputIndex,
  );

  if (!paramUtxo) {
    throw new Error("paramUtxo not found!");
  }

  // Fract NFT Validator
  const fractNftValidator = blueprint.validators.filter((val) =>
    val.title.includes("fract_nft.mint")
  );
  if (!fractNftValidator) {
    throw new Error("Fract NFT Validator not found!");
  }

  if (
    lockAssetUtxo == undefined || lockAssetUtxo == null ||
    lockAssetUtxo.input == null ||
    lockAssetUtxo.output == null
  ) {
    throw new Error("nftToLock not found!");
  }

  const parameterizedScript = applyParamsToScript(
    fractNftValidator[0].compiledCode,
    [
      builtinByteString(
        policy,
      ),
      builtinByteString(tokenNameHex),
      integer(amountM),
      integer(amountN),
      paramUtxo,
    ],
    "JSON",
  );

  const scriptAddr = serializePlutusScript(
    { code: parameterizedScript, version: "V3" },
    undefined,
    0,
  ).address;

  const fractPolicyId = resolveScriptHash(parameterizedScript, "V3");

  const wallet1Collateral = await BrowserWalletState.wallet.getCollateral();
  const wallet1Addy = await BrowserWalletState.wallet.getChangeAddress();

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
    "JSON",
  );
  const refScriptValAddr = serializePlutusScript(
    { code: refScriptValCode, version: "V3" },
    undefined,
    0,
  ).address;

  const unsignedTx = await txBuilder
    .txIn(
      lockAssetUtxo.input.txHash,
      lockAssetUtxo.input.outputIndex,
      lockAssetUtxo.output.amount,
      lockAssetUtxo.output.address,
    )
    .mintPlutusScriptV3()
    .mint("100", fractPolicyId, stringToHex("fract-" + tokenName))
    .mintingScript(parameterizedScript)
    .mintRedeemerValue(mConStr0([]))
    .txOut(scriptAddr, [{ unit: policy + tokenNameHex, quantity: "1" }])
    .txOut(refScriptValAddr, [{ unit: "lovelace", quantity: "7000000" }])
    .changeAddress(wallet1Addy)
    .selectUtxosFrom(utxos)
    .txOutReferenceScript(parameterizedScript, "V3")
    .txInCollateral(
      wallet1Collateral[0].input.txHash,
      wallet1Collateral[0].input.outputIndex,
      wallet1Collateral[0].output.amount,
      wallet1Collateral[0].output.address,
    )
    .complete();

  const signedTx = await BrowserWalletState.wallet.signTx(unsignedTx);
  const txHash = await BrowserWalletState.wallet.submitTx(signedTx);

  console.log("my fract minted tx hash:", txHash);
}

export async function TESTmint(name: string) {
  const validatorScript = applyParamsToScript(
    "59013b010100323232323232322533300232323232325332330083001300937540042646464a66601660080022a66601c601a6ea80180085854ccc02ccdc3a40040022a66601c601a6ea80180085858c02cdd500289919299980718088010992999806180298069baa0071337109000000899b8800148000dd698068008b180780099299980519b8748008c02cdd50008a5eb7bdb1804dd5980798061baa00132330010013756601e602060206020602060186ea8018894ccc038004530103d87a8000132333222533300f3372200e0062a66601e66e3c01c00c4cdd2a4000660266e980092f5c02980103d87a8000133006006001375c601a0026eacc038004c048008c040004dd7180698051baa002370e90000b1805980600198050011804801180480098021baa00114984d9595cd2ab9d5573caae7d5d02ba157441",
    [],
  );

  const policyId = resolveScriptHash(validatorScript, "V3");

  const tokenName2 = name;
  const tokenNameHex = stringToHex(tokenName2);
  const utxos = await BrowserWalletState.wallet.getUtxos();

  const wallet1Collateral = await BrowserWalletState.wallet.getCollateral();
  const wallet1Addy = await BrowserWalletState.wallet.getChangeAddress();

  const unsignedTx = await txBuilder
    .mintPlutusScriptV3()
    .mint("1", policyId, tokenNameHex)
    .mintingScript(validatorScript)
    .mintRedeemerValue(mConStr0([]))
    .changeAddress(wallet1Addy)
    .selectUtxosFrom(utxos)
    .txInCollateral(
      wallet1Collateral[0].input.txHash,
      wallet1Collateral[0].input.outputIndex,
      wallet1Collateral[0].output.amount,
      wallet1Collateral[0].output.address,
    )
    .complete();

  const signedTx = await BrowserWalletState.wallet.signTx(unsignedTx, true);
  const txHash = await BrowserWalletState.wallet.submitTx(signedTx);

  console.log("my_nft minted tx hash:", txHash);
}
