import { ECPairKey } from "./src/ecpairkey";
import { P2PKH } from "./src/p2pkh";
import { base58Encode, checksum, hexToBytes } from "./src/utils";

var pairKey = new ECPairKey({ network: "testnet" })
var transaction = new P2PKH(pairKey)

var address = "6f6bf19e55f94d986b4640c154d864699341919511"
address += checksum(hexToBytes(address))
address = base58Encode(address)
console.log("my address", address)

transaction.addInput({
    txindex: 0,
    scriptPubkey: "76a9146bf19e55f94d986b4640c154d86469934191951188ac",
    txid: "f34e1c37e736727770fed85d1b129713ef7f300304498c31c833985f487fa2f3",
})

transaction.addOutput({
    address: "mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt",
    value: 25100000
})

transaction.addOutput({
    address: address,
    value: 61900000
})

transaction.build()