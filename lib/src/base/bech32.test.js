"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const bech32_1 = require("./bech32");
describe("bech 32", () => {
    test("convert public key to address mainnet", () => {
        let bech = new bech32_1.Bech32({ publicKey: "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" });
        let address = bech.getAddress();
        expect(address).toBe("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
    });
    test("convert public key to address testnet", () => {
        let bech = new bech32_1.Bech32({ publicKey: "0333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f", network: "testnet" });
        let address = bech.getAddress();
        expect(address).toBe("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj");
    });
    test("convert ripemd in bech32 bytes", () => {
        let bech32 = new bech32_1.Bech32({ publicKey: "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" });
        let bech = bech32.convert((0, utils_1.hexToBytes)("751e76e8199196d454941c45d1b3a323f1433bd6"));
        //0x000e140f070d1a001912060b0d081504140311021d030c1d03040f1814060e1e16
        expect(bech[0]).toBe(0x00);
        expect(bech[1]).toBe(0x0e);
        expect(bech[2]).toBe(0x14);
        expect(bech[3]).toBe(0x0f);
        expect(bech[4]).toBe(0x07);
    });
    test("generate address", () => {
        // let address = Bech32.toAddress("751e76e8199196d454941c45d1b3a323f1433bd6")
        let bech = new bech32_1.Bech32({ publicKey: "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" });
        var intArray = Array.from((0, utils_1.hexToBytes)("000e140f070d1a001912060b0d081504140311021d030c1d03040f1814060e1e16"));
        let address = bech.encode(intArray);
        expect(address).toBe("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
    });
    test("decode address bech32", () => {
        var _a;
        let bech = new bech32_1.Bech32({ publicKey: "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" });
        var address = bech.decode("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4");
        var int8array = new Uint8Array((_a = address === null || address === void 0 ? void 0 : address.length) !== null && _a !== void 0 ? _a : 0);
        address === null || address === void 0 ? void 0 : address.forEach((num, index) => int8array[index] = num);
        expect((0, utils_1.bytesToHex)(int8array)).toBe("000e140f070d1a001912060b0d081504140311021d030c1d03040f1814060e1e16");
    });
    test("get the script hash", () => {
        let bech = new bech32_1.Bech32({ publicKey: "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" });
        let script = bech.getScriptPubkey(bech.getAddress());
        expect(script).toBe("751e76e8199196d454941c45d1b3a323f1433bd6");
    });
});
//# sourceMappingURL=bech32.test.js.map