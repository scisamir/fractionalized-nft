use aiken/collection/dict
use aiken/collection/list
use cardano/address.{Script}
use cardano/assets.{AssetName, PolicyId, quantity_of}
use cardano/transaction.{Input, Output, OutputReference, Transaction}

pub type Action {
  Mint
  Burn
}

validator fract_nft(
  nft_policy_id: PolicyId,
  nft_asset_name: AssetName,
  mint_tokens_quantity: Int,
  burn_tokens_quantity: Int,
) {
  mint(redeemer: Action, policy_id: PolicyId, self: Transaction) {
    let Transaction { inputs, outputs, mint, .. } = self

    let assets = mint |> assets.tokens(policy_id) |> dict.to_pairs()

    when redeemer is {
      Mint ->
        validate_mint(
          assets,
          inputs,
          outputs,
          policy_id,
          nft_policy_id,
          nft_asset_name,
          mint_tokens_quantity,
        )
      Burn -> validate_burn(assets, policy_id, inputs, burn_tokens_quantity)
    }
  }

  spend(_d: Option<Data>, _r: Data, utxo: OutputReference, self: Transaction) {
    let Transaction { inputs, mint, .. } = self

    expect Some(own_input) =
      list.find(inputs, fn(input) { input.output_reference == utxo })

    expect Script(policy_id) = own_input.output.address.payment_credential

    expect [Pair(_, quantity)] =
      mint |> assets.tokens(policy_id) |> dict.to_pairs

    quantity == -burn_tokens_quantity
  }

  else(_) {
    fail
  }
}

fn validate_mint(
  assets: Pairs<ByteArray, Int>,
  inputs: List<Input>,
  outputs: List<Output>,
  policy_id: PolicyId,
  nft_policy_id: PolicyId,
  nft_asset_name: AssetName,
  mint_tokens_quantity: Int,
) {
  let is_nft_in_inputs =
    inputs
      |> list.any(
          fn(input) {
            quantity_of(input.output.value, nft_policy_id, nft_asset_name) == 1
          },
        )

  let is_nft_in_outputs =
    outputs
      |> list.any(
          fn(output) {
            and {
              output.address.payment_credential == Script(policy_id),
              quantity_of(output.value, nft_policy_id, nft_asset_name) == 1,
            }
          },
        )

  let is_mint_quantity_valid = and {
      list.length(assets) == 1,
      assets
        |> list.all(fn(Pair(_, quantity)) { quantity == mint_tokens_quantity }),
    }

  and {
    is_nft_in_inputs?,
    is_nft_in_outputs?,
    is_mint_quantity_valid?,
  }
}

fn validate_burn(
  assets: Pairs<ByteArray, Int>,
  policy_id: PolicyId,
  inputs: List<Input>,
  burn_tokens_quantity: Int,
) {
  let is_burn_tokens_valid =
    assets
      |> list.any(fn(Pair(_, quantity)) { quantity == -burn_tokens_quantity })

  let is_input_valid =
    inputs
      |> list.any(
          fn(input) {
            and {
              quantity_of(input.output.value, nft_policy_id, nft_asset_name) == 1,
              input.output.address.payment_credential == Script(policy_id),
            }
          },
        )

  is_burn_tokens_valid? && is_input_valid?
}
