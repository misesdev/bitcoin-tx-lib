"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("../ecpairkey");
const txbase_1 = require("./txbase");
describe("transaction base class", () => {
    test("add input", () => {
        let pairKey = new ecpairkey_1.ECPairKey();
        let transaction = new txbase_1.BaseTransaction(pairKey);
        // expect(transaction.inputs.length).toBe(0)
        // transaction.addInput({
        //     txid: "",
        //     txindex: 0,
        //     scriptPubkey: ""
        // })
        expect(transaction.locktime).toBe(0);
    });
    test("add output", () => {
        let pairKey = new ecpairkey_1.ECPairKey();
        let transaction = new txbase_1.BaseTransaction(pairKey);
        // expect(transaction.outputs.length).toBe(0)
        // transaction.addOutput({
        //     address: "",
        //     value: 100
        // })
        expect(transaction.locktime).toBe(0);
    });
});
//# sourceMappingURL=txbase.test.js.map