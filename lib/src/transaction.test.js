"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("./ecpairkey");
const transaction_1 = require("./transaction");
describe("transaction", () => {
    const pairkey = ecpairkey_1.ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", {
        network: "testnet",
    });
    const transaction = new transaction_1.Transaction(pairkey);
    test("transaction non segwit P2PKH", () => {
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        });
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        });
        expect(transaction.isSegwit()).toBe(false);
    });
    test("segwit transaction P2PWKH", () => {
        transaction.clear();
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 29128,
            vout: 1
        });
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        });
        expect(transaction.isSegwit()).toBe(true);
        expect(transaction.weight()).toBe(328);
        expect(transaction.vBytes()).toBe(82);
        console.log(transaction.build());
    });
    test("get txid", () => {
        let txid = transaction.getTxid();
        expect(txid).toBe("17565349e3a89ec73e5c9fa68da322500f702215be9f75acb4fe953a9546fc59");
    });
    test("output raw", () => {
        let raw = transaction.outputsRaw();
        expect(raw).toBe("d46f000000000000160014aec042df56d9dc2fad0b30faf62eb94f07cba3cc");
    });
    test("verify segwit", () => {
        const result = transaction.isSegwit();
        expect(result).toBe(true);
    });
});
//# sourceMappingURL=transaction.test.js.map