import { ECPairKey } from "../ecpairkey"
import { BTransaction } from "./txbase"

describe("transaction base class", () => {
    it("add input", () => {
        let pairKey = new ECPairKey()
        let transaction = new BTransaction(pairKey)

        // expect(transaction.inputs.length).toBe(0)

        // transaction.addInput({
        //     txid: "",
        //     txindex: 0,
        //     scriptPubkey: ""
        // })

        expect(transaction.locktime).toBe(0)
    })

    it("add output", () => {
        let pairKey = new ECPairKey()
        let transaction = new BTransaction(pairKey)

        // expect(transaction.outputs.length).toBe(0)

        // transaction.addOutput({
        //     address: "",
        //     value: 100
        // })

        expect(transaction.locktime).toBe(0)
    })
})