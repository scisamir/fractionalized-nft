use cardano/transaction.{OutputReference, Transaction}

validator ref_script_val {
    spend(_d: Option<Data>, _r: Data, _o: OutputReference, _self: Transaction) {
        False
    }
}
