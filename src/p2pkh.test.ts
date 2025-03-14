import { ECPairKey } from "./ecpairkey"
import { P2PKH } from "./p2pkh"

const pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

const transaction = new P2PKH(pairKey)

transaction.version = 1 // this is the default value(is not necessare)
transaction.locktime = 0 // this is the default value(is not necessare)

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

describe("P2PKH switch", () => {
    
    test("create transaction row with 1 input", () => {
        expect(transaction.getTxid()).toBe("c59f0ae385c21f6302375cf5db918862d2819943f42bab44faf80c711da9bbad")
        expect(transaction.build()).toBe(`0100000001f3a27f485f9833c8318c490403307fef1397121b5dd8fe70777236e7371c4ef3000000006a473044
            02202662ba9ace06653baf83f4114965ddef6dc11d7c404d523635b0503aac68bbe902205b08149bf42dfd8137a6e28babe70c74e87011f23e95c547
            2898379835dfd1e3012103d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cffffffff02e0fe7e01000000001976a914
            18ba14b3682295cb05230e31fecb00089240660888ace084b003000000001976a914a65d1a239d4ec666643d350c7bb8fc44d28811
            2888ac00000000`.replace(/\s/g, ""))
    })
    
    test("create transaction row with 2 inputs or more", () => {
        // add the second input
        transaction.addInput({
            txindex: 0,
            scriptPubkey: "76a9146bf19e55f94d986b4640c154d86469934191951188ac",
            txid: "f34e1c37e736727770fed85d1b129713ef7f300304498c31c833985f487fa2f3",
        })

        expect(transaction.getTxid()).toBe("ed814c6bf565330b2a11289aa330061372a136fc9b7ff389205424643113a55a")
        expect(transaction.build()).toBe(`0100000002f3a27f485f9833c8318c490403307fef1397121b5dd8fe70777236e7371c4ef3000000006b483045022
            07b43127811d03e7f41c9366425b96f330affac6ceb240e3487d04de62dec5e990221008782485020c1cbe991b67e46d35d0cf6cd63169119de28c82209
            0fd27cd34a18012103d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cfffffffff3a27f485f9833c8318c490403307fef1
            397121b5dd8fe70777236e7371c4ef3000000006b48304502207b43127811d03e7f41c9366425b96f330affac6ceb240e3487d04de62dec5e9902210087
            82485020c1cbe991b67e46d35d0cf6cd63169119de28c822090fd27cd34a18012103d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b
            7df42645cffffffff02e0fe7e01000000001976a91418ba14b3682295cb05230e31fecb00089240660888ace084b003000000001976a914a65d1a239d4e
            c666643d350c7bb8fc44d288112888ac00000000`.replace(/\s/g, ""))
    })

    test("build signature", () => {
        transaction.generateSignatures()

        let scriptSig = transaction.inputScripts[0].hexScriptSig
        
        expect(scriptSig).toBe(`48304502207b43127811d03e7f41c9366425b96f330affac6ceb240e3487d04de62dec5e9902210087
            82485020c1cbe991b67e46d35d0cf6cd63169119de28c822090fd27cd34a18012103d0de0aaeaefad02b8bdc8a01a1b8b11c69
            6bd3d66a2c5f10780d95b7df42645c`.replace(/\s/g, ""))
    })
})
