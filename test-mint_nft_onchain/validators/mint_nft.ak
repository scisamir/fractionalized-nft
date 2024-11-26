use aiken/collection/dict
use cardano/assets.{PolicyId}
use cardano/transaction.{Transaction}

pub type Action {
  Mint
  Burn
}

validator mint_nft {
  mint(redeemer: Action, policy_id: PolicyId, self: Transaction) {
    let Transaction { mint, .. } = self

    expect [Pair(_, quantity)] =
      mint |> assets.tokens(policy_id) |> dict.to_pairs

    when redeemer is {
      Mint -> quantity > 0
      Burn -> quantity < 0
    }
  }

  else(_) {
    fail
  }
}
