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

  console.log("token:", tokenName);
  console.log("tokenHex:", tokenNameHex);

  console.log("wallet addy:", wallet1Address);

  console.log(utxos);
  console.log(utxos[0]);

  console.log("token:", tokenName);
  console.log("tokenHex:", tokenNameHex);

  console.log("wallet addy:", wallet1Address);

  // const r = await maestroProvider.get(
  //   "assets/" +
  //     policy + tokenNameHex + "/utxos",
  // );

  // console.log(await maestroProvider.fetchTxInfo(r.data[0].tx_hash));
  const hash = await maestroProvider.get(
    "assets/" +
      policy + tokenNameHex + "/mints",
  );

  console.log(hash);

  const mintData = await maestroProvider.get(
    "transactions/" + hash.data[0].tx_hash,
    +"/txo",
  );

  console.log(mintData);

  // const asset2 = mintData.data.outputs[0].assets[2];
  // console.log(asset2);

  // const hash2 = await maestroProvider.get(
  //   "assets/" +
  //     asset2.unit + "/mints",
  // );

  // console.log(hash);

  // const mintData2 = await maestroProvider.get(
  //   "transactions/" + hash2.data[0].tx_hash,
  //   +"/txo",
  // );

  // console.log(mintData2);

  // console.log(
  //   "//find: " +
  //     "c84f2755ba3913f381af73761d79432c1d31a1a45ec6b8208ec82b45f9bd7413" +
  //     "OR: " +
  //     "5f47ab04b7514c881749671de7185d25baff2aaef8e5f2f7bf28b520",
  // );

  const script = mintData.data.outputs[0].reference_script.bytes;

  // Fract NFT Validator
  const fractNftValidator = blueprint.validators.filter((val) =>
    val.title.includes("fract_nft.mint")
  );
  if (!fractNftValidator) {
    throw new Error("Fract NFT Validator not found!");
  }

  console.log(script);

  const scriptAddr = serializePlutusScript(
    { code: script, version: "V3" },
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

  const fractPolicyId = resolveScriptHash(script, "V3");
  console.log("fractPolicyId:", fractPolicyId);

  console.log("nft:");
  console.log(nftToUnLock);
  console.log("policy:");
  console.log(policy);
  console.log("Col:", wallet1Collateral[0]);

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      nftToUnLock.input.txHash,
      nftToUnLock.input.outputIndex,
      nftToUnLock.output.amount,
      nftToUnLock.output.address,
    )
    .txInScript(script)
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .mintPlutusScriptV3()
    .mint("-50", fractPolicyId, tokenNameHex)
    .mintingScript(script)
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
