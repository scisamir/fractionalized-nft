import { mConStr1, stringToHex } from "@meshsdk/core";
import { blockchainProvider, fractPolicyId, parameterizedScript, scriptAddr, txBuilder, wallet1, wallet1Address, wallet1Collateral, wallet1Utxos } from "./setup.js";

const tokenName = 'fract-' + 'onesie_sci';
console.log('tokeName:', tokenName);
const tokenNameHex = stringToHex(tokenName);

const nftToUnLockArray = await blockchainProvider.fetchAddressUTxOs(scriptAddr);
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
.txInScript(parameterizedScript)
.spendingReferenceTxInInlineDatumPresent()
.spendingReferenceTxInRedeemerValue("")
.mintPlutusScriptV3()
.mint("-60", fractPolicyId, tokenNameHex)
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

const signedTx = await wallet1.signTx(unsignedTx);
const txHash = await wallet1.submitTx(signedTx);

console.log('my fract burned tx hash:', txHash);
