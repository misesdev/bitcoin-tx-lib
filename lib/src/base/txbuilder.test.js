"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("../ecpairkey");
const txbuilder_1 = require("./txbuilder");
class TestTransactionBuilder extends txbuilder_1.TransactionBuilder {
    build(params) {
        return this.buildAndSign(params);
    }
    testGenerateScriptSig(input, params) {
        return this.generateScriptSig(input, params);
    }
    testGenerateWitness(input, params) {
        return this.generateWitness(input, params);
    }
    testValidateInput(input, inputs) {
        return this.validateInput(input, inputs);
    }
    testValidateOutput(output, outputs) {
        return this.validateOutput(output, outputs);
    }
    testOutputsRaw(outputs) {
        return this.outputsRaw(outputs);
    }
}
describe("TransactionBuilder", () => {
    const pairKey = new ecpairkey_1.ECPairKey();
    const baseInput = {
        txid: "a".repeat(64),
        vout: 0,
        scriptPubKey: "0014" + "ab".repeat(20), // P2WPKH
        value: 50000
    };
    const baseOutput = {
        address: pairKey.getAddress(),
        amount: 49000
    };
    const baseParams = {
        inputs: [baseInput],
        outputs: [baseOutput],
        pairkey: pairKey,
        locktime: 0,
        version: 2
    };
    let builder;
    beforeEach(() => {
        builder = new TestTransactionBuilder();
    });
    test("detects segwit input", () => {
        expect(builder.isSegwit([baseInput])).toBe(true);
    });
    test("detects non-segwit input", () => {
        const input = Object.assign(Object.assign({}, baseInput), { scriptPubKey: "76a914" + "ab".repeat(20) + "88ac" });
        expect(builder.isSegwit([input])).toBe(false);
    });
    test("builds and signs segwit transaction", () => {
        const raw = builder.build(baseParams);
        expect(raw).toBeInstanceOf(Uint8Array);
        expect(raw.length).toBeGreaterThan(0);
    });
    test("generates scriptSig correctly", () => {
        const input = Object.assign(Object.assign({}, baseInput), { scriptPubKey: "76a914" + "ab".repeat(20) + "88ac" });
        const sig = builder.testGenerateScriptSig(input, Object.assign(Object.assign({}, baseParams), { inputs: [input] }));
        expect(sig).toBeInstanceOf(Uint8Array);
        expect(sig.length).toBeGreaterThan(0);
    });
    test("generates witness correctly", () => {
        const witness = builder.testGenerateWitness(baseInput, baseParams);
        expect(witness).toBeInstanceOf(Uint8Array);
        expect(witness.length).toBeGreaterThan(0);
    });
    test("validates valid input", () => {
        expect(() => builder.testValidateInput(baseInput, [])).not.toThrow();
    });
    test("throws on invalid txid length", () => {
        const input = Object.assign(Object.assign({}, baseInput), { txid: "1234" });
        expect(() => builder.testValidateInput(input, [])).toThrow("Expected a valid txid");
    });
    test("throws on missing scriptPubKey", () => {
        const input = Object.assign(Object.assign({}, baseInput), { scriptPubKey: "" });
        expect(() => builder.testValidateInput(input, [])).toThrow("Expected scriptPubKey");
    });
    test("throws on duplicated txid", () => {
        expect(() => builder.testValidateInput(baseInput, [baseInput])).toThrow("already been added");
    });
    test("validates output", () => {
        expect(() => builder.testValidateOutput(baseOutput, [])).not.toThrow();
    });
    test("throws on invalid output amount", () => {
        const output = Object.assign(Object.assign({}, baseOutput), { amount: 0 });
        expect(() => builder.testValidateOutput(output, [])).toThrow("valid amount");
    });
    test("throws on invalid address", () => {
        const output = Object.assign(Object.assign({}, baseOutput), { address: "invalid" });
        expect(() => builder.testValidateOutput(output, [])).toThrow("valid address");
    });
    test("throws on duplicated output address", () => {
        expect(() => builder.testValidateOutput(baseOutput, [baseOutput])).toThrow("already been added");
    });
    test("serializes outputs", () => {
        const raw = builder.testOutputsRaw([baseOutput]);
        expect(raw).toBeInstanceOf(Uint8Array);
        expect(raw.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=txbuilder.test.js.map