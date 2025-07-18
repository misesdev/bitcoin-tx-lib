
import { HDTransactionBase } from "./hdtxbase";
import { Address } from "../utils/address";
import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction } from "../types";

// Mock concrete class to test abstract HDTransactionBase
class HDTransaction extends HDTransactionBase {
    public buildRaw() {
        return this.build("raw");
    }
    public buildTxid() {
        return this.build("txid");
    }
}

function generateMockKeyPair(): ECPairKey {
    return new ECPairKey({ network: "testnet" });
}

function generateMockInput(index: number): InputTransaction {
    return {
        txid: "a".repeat(64 - String(index).length) + index,
        vout: index,
        value: 50000,
        scriptPubKey: Address.getScriptPubkey(generateMockKeyPair().getAddress())
    };
}

function generateMockInputNoSegwit(index: number): InputTransaction {
    return {
        txid: "a".repeat(64 - String(index).length) + index,
        vout: index,
        value: 50000,
        scriptPubKey: Address.getScriptPubkey(generateMockKeyPair().getAddress("p2pkh"))
    };
}

function generateMockOutput(address: string, amount: number): OutputTransaction {
    return { address, amount };
}

describe("HDTransactionBase", () => {
    let tx: HDTransaction;
    let key1: ECPairKey;
    let key2: ECPairKey;
    let addr1: string;
    let addr2: string;

    beforeEach(() => {
        tx = new HDTransaction();
        key1 = generateMockKeyPair();
        key2 = generateMockKeyPair();
        addr1 = key1.getAddress();
        addr2 = key2.getAddress();
    });

    test("should initialize with default options", () => {
        expect(tx.version).toBe(2);
        expect(tx.locktime).toBe(0);
    });

    test("should add valid input and associate key", () => {
        const input = generateMockInput(0);
        tx.addInput(input, key1);
        expect(tx["inputs"].length).toBe(1);
        expect(tx["signingKeys"].has(`${input.txid}:${input.vout}`)).toBe(true);
    });

    test("should throw error when adding duplicate input", () => {
        const input = generateMockInput(0);
        tx.addInput(input, key1);
        expect(() => tx.addInput(input, key1)).toThrow("An input with this txid has already been added");
    });

    test("should add valid output", () => {
        const output = generateMockOutput(addr1, 10000);
        tx.addOutput(output);
        expect(tx["outputs"].length).toBe(1);
    });

    test("should throw error when adding invalid output", () => {
        const output = generateMockOutput("invalidAddress", 10000);
        expect(() => tx.addOutput(output)).toThrow("Expected a valid address to output");
    });

    test("should detect segwit if input is P2WPKH", () => {
        const segwitKey = generateMockKeyPair();
        const address = segwitKey.getAddress();
        const input = {
            txid: "b".repeat(64),
            vout: 1,
            value: 30000,
            scriptPubKey: Address.getScriptPubkey(address),
        };
        tx.addInput(input, segwitKey);
        expect(tx.isSegwit()).toBe(true);
    });

    test("should return false if no segwit input", () => {
        const input = generateMockInputNoSegwit(1);
        tx.addInput(input, key1);
        expect(tx.isSegwit()).toBe(false);
    });

    test("should build raw transaction with P2PKH input", () => {
        const input = generateMockInput(0);
        tx.addInput(input, key1);
        tx.addOutput(generateMockOutput(addr1, 10000));
        const raw = tx.buildRaw();
        expect(raw.length).toBeGreaterThan(0);
    });

    test("should build raw transaction with multiple inputs and keys", () => {
        const input1 = generateMockInput(0);
        const input2 = generateMockInput(1);
        tx.addInput(input1, key1);
        tx.addInput(input2, key2);
        tx.addOutput(generateMockOutput(addr2, 20000));
        const raw = tx.buildRaw();
        expect(raw.length).toBeGreaterThan(0);
    });

    test("should throw if input missing signing key", () => {
        const input = generateMockInput(0);
        // purposely not setting a signing key
        tx["inputs"].push(input);
        expect(() => tx.buildRaw()).toThrow("Missing signing key for input");
    });

    test("clear() should reset all internal state", () => {
        const input = generateMockInput(0);
        tx.addInput(input, key1);
        tx.addOutput(generateMockOutput(addr1, 10000));
        tx.clear();
        expect(tx["inputs"].length).toBe(0);
        expect(tx["outputs"].length).toBe(0);
        expect(tx["signingKeys"].size).toBe(0);
        expect(tx["cachedata"].size).toBe(0);
    });

    test("should build txid-optimized transaction", () => {
        const input = generateMockInput(0);
        tx.addInput(input, key1);
        tx.addOutput(generateMockOutput(addr1, 10000));
        const txidBuild = tx.buildTxid();
        expect(txidBuild.length).toBeGreaterThan(0);
    });
});
