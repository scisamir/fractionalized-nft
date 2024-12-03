import { mConStr1, stringToHex } from "@meshsdk/core";
import {
  blockchainProvider,
  getAddress,
  getCollateral,
  getUtxos,
  initWallet,
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

  const wallet1 = new MeshWallet({
    networkId: 0,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: "address",
      address: await BrowserWalletState.wallet.getChangeAddress(),
    },
  });

  await initWallet(wallet1);

  const utxos = await BrowserWalletState.wallet.getUtxos();
  console.log(utxos);
  let lockAssetUtxo: UTxO;

  utxos.forEach((e: UTxO) => {
    e.output.amount.forEach((asset: any) => {
      if (asset.unit == policy + tokenNameHex) {
        lockAssetUtxo = e;
      }
    });
  });

  const wallet1Address = await BrowserWalletState.wallet.getChangeAddress();

  console.log("nftToLock:", lockAssetUtxo);

  console.log("token:", tokenName);
  console.log("tokenHex:", tokenNameHex);

  console.log("wallet addy:", wallet1Address);

  console.log(utxos);

  console.log("nftToLock:", lockAssetUtxo);

  console.log("token:", tokenName);
  console.log("tokenHex:", tokenNameHex);

  console.log("wallet addy:", wallet1Address);

  const paramUtxo = outputReference(
    lockAssetUtxo.input.txHash,
    lockAssetUtxo.input.outputIndex,
  );
  console.log("utxo");
  console.log(paramUtxo);

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

  const fractPolicyId = resolveScriptHash(parameterizedScript, "V3");
  console.log("fractPolicyId:", fractPolicyId);
  const wallet1Collateral = await getCollateral();
  const wallet1Addy = await getAddress();
  const wallet1Utxos = await getUtxos();

  const unsignedTx = await txBuilder
    .spendingPlutusScriptV3()
    .txIn(
      lockAssetUtxo.input.txHash,
      lockAssetUtxo.input.outputIndex,
      lockAssetUtxo.output.amount,
      lockAssetUtxo.output.address,
    )
    .txInScript(parameterizedScript)
    .spendingReferenceTxInInlineDatumPresent()
    .spendingReferenceTxInRedeemerValue("")
    .mintPlutusScriptV3()
    .mint("-50", fractPolicyId, tokenNameHex)
    .mintingScript(parameterizedScript)
    .mintRedeemerValue(mConStr1([]))
    .txOut(wallet1Address, [])
    .changeAddress(wallet1Address)
    .selectUtxosFrom(wallet1Utxos)
    .txInCollateral(
      wallet1Collateral.input.txHash,
      wallet1Collateral.input.outputIndex,
      wallet1Collateral.output.amount,
      wallet1Collateral.output.address,
    )
    .complete();

  const signedTx = await BrowserWalletState.wallet.signTx(unsignedTx);
  const txHash = await BrowserWalletState.wallet.submitTx(signedTx);

  console.log("my fract burned tx hash:", txHash);
}
