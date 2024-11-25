# Fractionalized NFT Validator

## To mint
- Check if the NFT with the parameterized policy_id and asset_name is in the inputs with a quantity of 1
- Check if the NFT is in the outputs and it is going to the script validator's address
- Check if only one token type (name) is requested to be minted and the quantity is the same with the parameterized mint_tokens_quantity

## To Burn
- Check if the quantity of tokens requested to be burned is the same with the parameterized burn_tokens_quantity
- Check if the NFT is provided as an input with the quantity of 1 (quantity check not necassary here though, just because it's the check used)
- Check if the NFT input is a utxo coming from the validator address

## To spend
- Check utxo from spend handler, check for input related to the utxo, and get the policy ID (No need to check for a utxo coming directly from the validator since it is matched automatically with the spend handler).
- Get the token with the related policy id and confirm that the quantity is the same with the parameterized burn_tokens_quantity
