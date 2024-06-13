import { ECPairKey } from "./ecpairkey"
import { P2PKH } from "./p2pkh"
import { bytesToHex, hexToBytes, sha256 } from "./utils"

describe("P2PKH switch", () => {
    it("create transaction row", () => {
        var pairKey = new ECPairKey({ privateKey: "16260783e40b16731673622ac8a5b045fc3ea4af70f727f3f9e92bdd3a1ddc42", network: "testnet" })

        var transaction = new P2PKH(pairKey)

        transaction.version = 1
        transaction.locktime = 0

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
            address: "mqMi3XYqsPvBWtrJTk8euPWDVmFTZ5jHuK",//pairKey.getAddress(),
            value: 61900000
        })

        var transactionRow = transaction.build()
        
        var hash256 = sha256(hexToBytes(transactionRow), true)

        expect(transaction.getTxid()).toBe(bytesToHex(hexToBytes(hash256).reverse()))
    })
})