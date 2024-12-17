import { mConStr1, stringToHex } from "@meshsdk/core";
import {
  blockchainProvider,
  getAddress,
  getCollateral,
  getUtxos,
  initWallet,
  maestroProvider,
  txBuilder,
} from "./setup.ts";

import { applyCborEncoding } from "@meshsdk/core-csl";

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

export async function burn(policy: string, tokenName: string) {
  const tokenNameHex = stringToHex(tokenName);

  const utxos = await BrowserWalletState.wallet.getUtxos();

  const wallet1Address = await BrowserWalletState.wallet.getChangeAddress();

  const hash = await maestroProvider.get(
    "assets/" +
      policy + tokenNameHex + "/mints",
  );

  console.log(hash);

  if (!hash || hash == undefined || hash == null) {
    throw new Error("Error: NFT not found!");
  }

  const tx_hash = hash.data[0].tx_hash;

  const mintData = await maestroProvider.get(
    "transactions/" + tx_hash,
    // +"/txo",
  );
  console.log(mintData);

  const refScriptidx = 1;

  const mintScript = applyCborEncoding(
    mintData.data.outputs[refScriptidx].reference_script.bytes,
  );

  console.log(mintData.data.outputs[refScriptidx].datum.json.fields[1].int);

  // Fract NFT Validator
  const fractNftValidator = blueprint.validators.filter((val) =>
    val.title.includes("fract_nft.mint")
  );
  if (!fractNftValidator) {
    throw new Error("Fract NFT Validator not found!");
  }

  const scriptAddr = serializePlutusScript(
    { code: mintScript, version: "V3" },
    undefined,
    0,
  ).address;

  console.log("script address:", scriptAddr, "\n");

  const unLockAssetUtxo = await blockchainProvider.fetchAddressUTxOs(
    scriptAddr,
  );

  const nftToUnLock = unLockAssetUtxo[0];

  const wallet1Collateral = await BrowserWalletState.wallet.getCollateral();
  const wallet1Addy = await BrowserWalletState.wallet.getChangeAddress();

  const fractPolicyId = resolveScriptHash(mintScript, "V3");
  console.log("fractPolicyId:", fractPolicyId);

  console.log("nft:");
  console.log(unLockAssetUtxo);
  console.log("Col:", wallet1Collateral[0]);

  const amt = mintData.data.outputs[refScriptidx].datum.json.fields[1].int * -1;
  console.log(amt.toString());

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      nftToUnLock.input.txHash,
      nftToUnLock.input.outputIndex,
      nftToUnLock.output.amount,
      nftToUnLock.output.address,
    )
    .spendingTxInReference(tx_hash, refScriptidx)
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .mintPlutusScriptV3()
    .mint(
      `${amt.toString()}`,
      fractPolicyId,
      tokenNameHex,
    )
    .mintTxInReference(tx_hash, refScriptidx)
    .mintRedeemerValue(mConStr1([]))
    .txOut(wallet1Addy, [])
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

  console.log("my fract burned tx hash:", txHash);
}
