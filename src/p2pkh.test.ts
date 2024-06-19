import { ECPairKey } from "./ecpairkey"
import { P2PKH } from "./p2pkh"

describe("P2PKH switch", () => {
    it("create transaction row with 1 input", () => {
        let pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

        let transaction = new P2PKH(pairKey)

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
            address: pairKey.getAddress(),
            value: 61900000
        })

        expect(transaction.getTxid()).toBe("c59f0ae385c21f6302375cf5db918862d2819943f42bab44faf80c711da9bbad")
        expect(transaction.build()).toBe("0100000001f3a27f485f9833c8318c490403307fef1397121b5dd8fe70777236e7371c4ef3000000006a47304402202662ba9ace06653baf83f4114965ddef6dc11d7c404d523635b0503aac68bbe902205b08149bf42dfd8137a6e28babe70c74e87011f23e95c5472898379835dfd1e3012103d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cffffffff02e0fe7e01000000001976a91418ba14b3682295cb05230e31fecb00089240660888ace084b003000000001976a914a65d1a239d4ec666643d350c7bb8fc44d288112888ac00000000")
    })
    it("create transaction row with 2 inputs or more", () => {
        let pairKey = new ECPairKey({ privateKey: "514321cfa3c255be2ce8249a70267b9d2935b7dc5b36055ba158d5f00c645f83", network: "testnet" })

        let transaction = new P2PKH(pairKey)
    })
})