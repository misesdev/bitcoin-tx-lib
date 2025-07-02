"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hdtransaction_1 = require("./hdtransaction");
const hdwallet_1 = require("./hdwallet");
describe("transaction class", () => {
    let wallet;
    let transaction;
    beforeEach(() => {
        wallet = hdwallet_1.HDWallet.create().hdwallet;
        transaction = new hdtransaction_1.HDTransaction();
    });
    test("Must add a valid entry", () => {
        const input = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        };
        transaction.addInput(input, wallet.getPairKey(0));
        expect(transaction.inputs).toContainEqual(input);
    });
    test("Should throw error when adding entry with duplicate txid", () => {
        const input = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        };
        transaction.addInput(input, wallet.getPairKey(0));
        expect(() => transaction.addInput(input, wallet.getPairKey(1))).toThrow("An input with this txid has already been added");
    });
    test("Must add a valid output", () => {
        const output = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 29128
        };
        transaction.addOutput(output);
        expect(transaction.outputs).toContainEqual(output);
    });
    test("Should throw error when adding output with invalid address", () => {
        const output = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg8vh8hlvf",
            amount: 29128
        };
        expect(() => transaction.addOutput(output)).toThrow("Expected a valid address to output");
    });
    test("Should throw error when adding output with already existing address", () => {
        const output = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 29128
        };
        transaction.addOutput(output);
        expect(() => transaction.addOutput(output)).toThrow("An output with this address has already been added");
    });
    test("Must assemble a non-witness P2PKH transaction", () => {
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        }, wallet.getPairKey(0));
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        });
        transaction.sign();
        // let txid = transaction.getTxid()
        // let txraw = transaction.getRawHex()
        // console.log(txid)
        // console.log(txraw)
        expect(transaction.isSegwit()).toBe(false);
        expect(752).toEqual(transaction.weight());
        expect(188).toEqual(transaction.vBytes());
    });
    test("Must set up a P2PWKH segregated witness transaction", () => {
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 29128,
            vout: 1
        }, wallet.getPairKey(0));
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        });
        transaction.sign();
        expect(transaction.isSegwit()).toBe(true);
        expect(437).toEqual(transaction.weight());
        expect(110).toEqual(transaction.vBytes());
        expect(110).toEqual(transaction.getFeeSats());
    });
    test("Must resolve network fee for payer exit", () => {
        transaction = new hdtransaction_1.HDTransaction({
            whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            fee: 1 // 1 sat/vb
        });
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        }, wallet.getPairKey(0));
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        });
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        });
        transaction.sign();
        transaction.resolveFee();
        expect(transaction.outputs[0].amount).toBeLessThan(15000);
        expect(transaction.outputs[1].amount).toEqual(15000);
        expect(141).toEqual(transaction.getFeeSats());
        expect(561).toEqual(transaction.weight());
        expect(141).toEqual(transaction.vBytes());
    });
    test("Must resolve network fee for receiver output", () => {
        var _a, _b;
        transaction = new hdtransaction_1.HDTransaction({
            whoPayTheFee: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            fee: 1 // 1 sat/vb
        });
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        }, wallet.getPairKey(0));
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        });
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        });
        transaction.sign();
        transaction.resolveFee();
        expect((_a = transaction.outputs[0]) === null || _a === void 0 ? void 0 : _a.amount).toEqual(15000);
        expect((_b = transaction.outputs[1]) === null || _b === void 0 ? void 0 : _b.amount).toBeLessThan(15000);
        expect(141).toEqual(transaction.getFeeSats());
        expect(561).toEqual(transaction.weight());
        expect(141).toEqual(transaction.vBytes());
    });
    test("Must solve the network fee by distributing the cost equally to all outputs", () => {
        transaction = new hdtransaction_1.HDTransaction({
            whoPayTheFee: "everyone",
            fee: 1 // 1 sat/vb
        });
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        }, wallet.getPairKey(0));
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        });
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        });
        transaction.sign();
        transaction.resolveFee();
        expect(transaction.outputs[0].amount).toBeLessThan(15000);
        expect(transaction.outputs[1].amount).toBeLessThan(15000);
        expect(141).toEqual(transaction.getFeeSats());
        expect(561).toEqual(transaction.weight());
        expect(141).toEqual(transaction.vBytes());
    });
});
//# sourceMappingURL=hdtransaction.test.js.map