"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("../ecpairkey");
const txbase_1 = require("./txbase");
class Extended extends txbase_1.BaseTransaction {
}
describe("BaseTransaction", () => {
    let tx;
    let key;
    const validInput = {
        txid: "a".repeat(64),
        vout: 1,
        scriptPubKey: "0014" + "a".repeat(40),
        value: 5000,
        sequence: undefined,
    };
    const validOutput = {
        address: new ecpairkey_1.ECPairKey().getAddress(),
        amount: 4900,
    };
    beforeEach(() => {
        key = new ecpairkey_1.ECPairKey();
        tx = new Extended(key);
    });
    test("constructor sets defaults", () => {
        expect(tx.version).toBe(2);
        expect(tx.locktime).toBe(0);
        expect(tx["cachedata"]).toBeInstanceOf(Map);
    });
    test("addInput appends valid input", () => {
        tx.addInput(validInput);
        expect(tx["inputs"].length).toBe(1);
        expect(tx["inputs"][0].sequence).toBe("fffffffd");
    });
    test("addInput throws on invalid txid length", () => {
        expect(() => tx.addInput(Object.assign(Object.assign({}, validInput), { txid: "abc" }))).toThrow("Expected a valid txid");
    });
    test("addInput throws on missing scriptPubKey", () => {
        expect(() => tx.addInput(Object.assign(Object.assign({}, validInput), { scriptPubKey: "" }))).toThrow("Expected scriptPubKey");
    });
    test("addInput throws on duplicate txid", () => {
        tx.addInput(validInput);
        expect(() => tx.addInput(validInput)).toThrow("An input with this txid has already been added");
    });
    test("addOutput appends valid output", () => {
        tx.addOutput(validOutput);
        expect(tx["outputs"].length).toBe(1);
    });
    test("addOutput throws on amount <= 0", () => {
        expect(() => tx.addOutput(Object.assign(Object.assign({}, validOutput), { amount: 0 }))).toThrow("Expected a valid amount");
    });
    test("addOutput throws on invalid address", () => {
        expect(() => tx.addOutput(Object.assign(Object.assign({}, validOutput), { address: "invalid" }))).toThrow("Expected a valid address to output");
    });
    test("addOutput throws on duplicate address", () => {
        tx.addOutput(validOutput);
        expect(() => tx.addOutput(validOutput)).toThrow("An output with this address has already been added");
    });
    test("clear resets inputs, outputs and cache", () => {
        tx.addInput(validInput);
        tx.addOutput(validOutput);
        tx.clear();
        expect(tx["inputs"].length).toBe(0);
        expect(tx["outputs"].length).toBe(0);
        expect(tx["cachedata"].size).toBe(0);
    });
    test("isSegwit returns true if input is segwit", () => {
        tx.addInput(validInput);
        expect(tx.isSegwit()).toBe(true);
    });
    test("isSegwit returns false if no segwit input", () => {
        const legacyInput = Object.assign(Object.assign({}, validInput), { scriptPubKey: "76a914" + "00".repeat(20) + "88ac" });
        tx.addInput(legacyInput);
        expect(tx.isSegwit()).toBe(false);
    });
    test("build returns raw transaction buffer", () => {
        tx.addInput(validInput);
        tx.addOutput(validOutput);
        const result = tx["build"]("raw");
        expect(result).toBeInstanceOf(Uint8Array);
        expect(result.length).toBeGreaterThan(0);
    });
    test("buildWitness returns witness field for input", () => {
        tx.addInput(validInput);
        tx.addOutput(validOutput);
        const witness = tx["buildWitness"](validInput);
        expect(witness).toBeInstanceOf(Uint8Array);
    });
    test("buildScriptSig returns scriptSig field for input", () => {
        const legacyInput = Object.assign(Object.assign({}, validInput), { scriptPubKey: "76a914" + "00".repeat(20) + "88ac" });
        tx.addInput(legacyInput);
        tx.addOutput(validOutput);
        const sig = tx["buildScriptSig"](legacyInput);
        expect(sig).toBeInstanceOf(Uint8Array);
    });
});
//# sourceMappingURL=txbase.test.js.map