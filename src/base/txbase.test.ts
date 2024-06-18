import { ECPairKey } from "../ecpairkey"
import { BTransaction } from "./txbase"

describe("transaction base class", () => {
    it("add input", () => {
        let pairKey = new ECPairKey()
        var transaction = new BTransaction(pairKey)

        expect(transaction.inputs.length).toBe(0)

        transaction.addInput({
            txid: "",
            txindex: 0,
            scriptPubkey: ""
        })

        expect(transaction.inputs.length).toBe(1)
    })

    it("add output", () => {
        let pairKey = new ECPairKey()
        var transaction = new BTransaction(pairKey)

        expect(transaction.outputs.length).toBe(0)

        transaction.addOutput({
            address: "",
            value: 100
        })

        expect(transaction.outputs.length).toBe(1)
    })
})