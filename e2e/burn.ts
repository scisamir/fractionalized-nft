import { MaestroProvider, mConStr1, serializePlutusScript, stringToHex } from "@meshsdk/core";
import { maestroProvider, txBuilder, wallet1, wallet1Address, wallet1Collateral, wallet1Utxos } from "./setup.js";
import dotenv from "dotenv";
import { applyCborEncoding } from "@meshsdk/core-csl";

const tokenName = 'fract-' + 'fenix';
console.log('tokeName:', tokenName);
const tokenNameHex = stringToHex(tokenName);


// New
const policy = "dc938dbc5d1689103e1f10a593aa2019e227499f8b1190fea643fc37";

const hash = await maestroProvider.get(
  "assets/" +
    policy + tokenNameHex + "/mints",
);

const tx_hash = hash.data[0].tx_hash;

console.log('maestro hash:', hash, '\n');

const mintData = await maestroProvider.get(
  "transactions/" + tx_hash,
  // +"/txo",
);

const refScriptidx = 1;

// const mintScript = applyParamsToScript(
//   mintData.data.outputs[1].reference_script.hash,
//   [],
//   "JSON"
// );
const mintScript = applyCborEncoding(mintData.data.outputs[refScriptidx].reference_script.bytes);
const mintAddress = serializePlutusScript(
  { code: mintScript, version: "V3" },
  undefined,
  0
).address;

// console.log('maestro mint data:', mintData, '\n');
// console.log('maestro mint data outputs:', mintData.data.outputs);

// console.log('reference script:', mintData.data.outputs[1].reference_script.bytes);
// console.log('policy id / script hash:', mintData.data.outputs[1].reference_script.hash);

// const hash2 = await maestroProvider.get(
//   "assets/" +
//     mintData.data.outputs[0].assets[1].unit + "/mints",
// );

// console.log(hash2);

// const mintData2 = await maestroProvider.get(
//   "transactions/" + hash2.data[0].tx_hash,
//   +"/txo",
// );

// console.log(mintData2);
// New end


const nftToUnLockArray = await maestroProvider.fetchAddressUTxOs(mintAddress);
const nftToUnLock = nftToUnLockArray[0];
console.log('nftToUnLock:', nftToUnLock);
console.log('amount:', nftToUnLock.output.amount)

const unsignedTx = await txBuilder
.spendingPlutusScriptV3()
.txIn(
    nftToUnLock.input.txHash,
    nftToUnLock.input.outputIndex,
    nftToUnLock.output.amount,
    nftToUnLock.output.address,
)
// .txInScript(parameterizedScript)
.spendingTxInReference(tx_hash, refScriptidx)
.spendingReferenceTxInInlineDatumPresent()
.spendingReferenceTxInRedeemerValue("")
.mintPlutusScriptV3()
.mint("-60", policy, tokenNameHex)
// .mintingScript(parameterizedScript)
.mintTxInReference(tx_hash, refScriptidx)
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

const signedTx = await wallet1.signTx(unsignedTx);
const txHash = await wallet1.submitTx(signedTx);

console.log('my fract burned tx hash:', txHash);
