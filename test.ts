import { ECPairKey } from "./src/ecpairkey"
import { P2PKH } from "./src/p2pkh"

var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

var transaction = new P2PKH(pairKey)

transaction.version = 1
transaction.locktime = 0

transaction.addInput({
    scriptPubkey: "76a9146bf19e55f94d986b4640c154d86469934191951188ac",
    txid: "f34e1c37e736727770fed85d1b129713ef7f300304498c31c833985f487fa2f3",
    txindex: 0
})

transaction.addOutput({
    address: "mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt",
    value: 25100000
})

transaction.addOutput({
    address: pairKey.getAddress(),
    value: 61900000
})

var transactionRow = transaction.build()

console.log("transactionRow", transactionRow)
console.log("txid", transaction.getTxid())