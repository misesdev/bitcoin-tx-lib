import { ECPairKey } from "../ecpairkey"
import { BaseTransaction } from "./txbase"

describe("transaction base class", () => {
    
    test("add input", () => {
        let pairKey = new ECPairKey()
        let transaction = new BaseTransaction(pairKey)

        // expect(transaction.inputs.length).toBe(0)

        // transaction.addInput({
        //     txid: "",
        //     txindex: 0,
        //     scriptPubkey: ""
        // })

        expect(transaction.locktime).toBe(0)
    })

    test("add output", () => {
        let pairKey = new ECPairKey()
        let transaction = new BaseTransaction(pairKey)

        // expect(transaction.outputs.length).toBe(0)

        // transaction.addOutput({
        //     address: "",
        //     value: 100
        // })

        expect(transaction.locktime).toBe(0)
    })
})
