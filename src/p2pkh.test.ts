import { ECPairKey } from "./ecpairkey"
import { P2PKH } from "./p2pkh"
import { bytesToHex, hexToBytes, reverseHexLE, sha256 } from "./utils"

describe("P2PKH switch", () => {
    it("create transaction row", () => {
        var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

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
            address: pairKey.getAddress(),
            value: 61900000
        })

        expect(transaction.getTxid()).toBe("2de56daa25d88f200e81eea36a41d82a2394f50f80f0d72776443a6172e9c55d")
        expect(transaction.build()).toBe("0100000001f3a27f485f9833c8318c490403307fef1397121b5dd8fe70777236e7371c4ef3000000006b483045022027ebbe9ce81ddc0333f19fbbce027a0ab0bc7a5ad684a83db85b222dc0ee2de4022100d6842b3a78d7d8184ea8a8a75474779dcb772820fd82ff3040aaa03586019d5f012102d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cffffffff0217efee00000000001976a91418ba14b3682295cb05230e31fecb00089240660888ac3b084e00000000001976a914a65d1a239d4ec666643d350c7bb8fc44d288112888ac00000000")
    })
})