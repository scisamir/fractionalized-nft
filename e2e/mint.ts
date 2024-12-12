import { mConStr0, stringToHex } from "@meshsdk/core";
import {
  fractPolicyId,
  maestroProvider,
  parameterizedScript,
  refScriptValAddr,
  scriptAddr,
  txBuilder,
  wallet1,
  wallet1Address,
  wallet1Collateral,
  wallet1Utxos,
} from "./setup.js";

const tokenName = "fract-" + "fenix";
console.log("tokeName:", tokenName);
const tokenNameHex = stringToHex(tokenName);

const nftToLockArray = await maestroProvider.fetchUTxOs(
  "088e36e5999a69521c4bae68b399cf799a111f0824a6fba773e815fb65b331dd",
  0,
);
const nftToLock = nftToLockArray[0];
console.log("nftToLock:", nftToLock);
console.log("amount:", nftToLock.output.amount);
const nftToLockUnit =
  "cad3ae15ed1cfc018198ba091728384178c324d48892be56ac3c2e9666656e6978";

const unsignedTx = await txBuilder
  .txIn(
    nftToLock.input.txHash,
    nftToLock.input.outputIndex,
    nftToLock.output.amount,
    nftToLock.output.address,
  )
  .mintPlutusScriptV3()
  .mint("120", fractPolicyId, tokenNameHex)
  .mintingScript(parameterizedScript)
  .mintRedeemerValue(mConStr0([]))
  .txOut(scriptAddr, [{ unit: nftToLockUnit, quantity: "1" }])
  .txOut(refScriptValAddr, [{ unit: "lovelace", quantity: "7000000" }])
  .txOutReferenceScript(parameterizedScript, "V3")
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

console.log("my fract minted tx hash:", txHash);
