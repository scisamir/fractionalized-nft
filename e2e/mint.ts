import { mConStr0, stringToHex } from "@meshsdk/core";
import { blockchainProvider, fractPolicyId, parameterizedScript, scriptAddr, txBuilder, wallet1, wallet1Address, wallet1Collateral, wallet1Utxos } from "./setup.js";

const tokenName = 'fract-' + 'onesie_sci';
console.log('tokeName:', tokenName);
const tokenNameHex = stringToHex(tokenName);

const nftToLockArray = await blockchainProvider.fetchUTxOs("f591e09681e51a20c97f260f83735edecb1b20be624fe6ef5747a56d314601a7", 0);
const nftToLock = nftToLockArray[0];
console.log('nftToLock:', nftToLock);
console.log('amount:', nftToLock.output.amount)
const nftToLockUnit = "b2af4d6208ee4114c74dc01b7111ba1df61a94a2d7d2fd7c473b139f6f6e657369655f736369"

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

console.log('my fract minted tx hash:', txHash);
