"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe("utils", () => {
    test("bytes to hex string", () => {
        let bytes = new Uint8Array(4);
        let array = [5, 128, 255, 255];
        array.forEach((byte, index) => bytes[index] = byte);
        let hex = (0, index_1.bytesToHex)(bytes);
        expect(hex).toBe("0580ffff");
        let error = false;
        try {
            (0, index_1.bytesToHex)(new Uint8Array());
        }
        catch (_a) {
            error = true;
        }
        finally {
            // a validation error should occur as the value is empty
            expect(error).toBe(true);
        }
    });
    test("hex to byte array", () => {
        let hex = "0580ffff";
        let bytes = (0, index_1.hexToBytes)(hex);
        expect(bytes[0]).toBe(5);
        expect(bytes[1]).toBe(128);
        expect(bytes[2]).toBe(255);
        expect(bytes[3]).toBe(255);
        let error = false;
        try {
            (0, index_1.hexToBytes)("");
        }
        catch (_a) {
            error = true;
        }
        // a validation error should occur as the value is empty
        expect(error).toBe(true);
        error = false;
        try {
            (0, index_1.hexToBytes)("80ff05f");
        }
        catch (_b) {
            error = true;
        }
        // a validation error should occur as the value is incorrect
        expect(error).toBe(true);
    });
    test("hash sha256 and hash256", () => {
        const hash = (0, index_1.sha256)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"));
        expect(hash).toBeDefined();
        const hash256 = (0, index_1.sha256)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"), true);
        expect((0, index_1.bytesToHex)(hash256)).toBe("507a5b8dfed0fc6fe8801743720cedec06aa5c6fca72b07c49964492fb98a714");
    });
    test("hash checksum", () => {
        const checksumBytes = (0, index_1.checksum)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"));
        expect((0, index_1.bytesToHex)(checksumBytes)).toBe("507a5b8d");
    });
    test("hash ripemd160", () => {
        let sha256 = (0, index_1.hexToBytes)("6b23c0eabc34e97f4b5f8c2277d6b7f6869b16dfb4f2c284b94efc13a3d81b0c");
        let hash = (0, index_1.ripemd160)(sha256);
        expect((0, index_1.bytesToHex)(hash)).toBe("825e1e77af4ea56228f2c96385dc24d9ba788a8c");
        // generating ripemd160 hash based on characters and not considering hexadecimal
        //hash = ripemd160(hexToBytes(sha256, false))
        //expect(bytesToHex(hash)).toBe("fad534e4b13dd564f2c0e20120e79ff1d5b07548")
        // generate for address ripemd160(sha256(hash))
        hash = (0, index_1.ripemd160)(sha256, true);
        expect((0, index_1.bytesToHex)(hash)).toBe("58077dda57de14ac9f055c64bf3c71ff0b5796da");
    });
    test("reverse endian bytes", () => {
        const bytes = new Uint8Array(4);
        bytes[0] = 0x80;
        bytes[1] = 0x45;
        bytes[2] = 0xf8;
        bytes[3] = 0xff;
        const letleEndian = (0, index_1.reverseEndian)(bytes);
        expect(letleEndian[0]).toBe(0xff);
        expect(letleEndian[1]).toBe(0xf8);
        expect(letleEndian[2]).toBe(0x45);
        expect(letleEndian[3]).toBe(0x80);
    });
    test("convert a number integer in hexadecimal", () => {
        let hexNumber = (0, index_1.numberToHex)(1, 32); // 32bits
        expect((0, index_1.bytesToHex)(hexNumber)).toBe("00000001");
        hexNumber = (0, index_1.numberToHex)(0, 32);
        expect((0, index_1.bytesToHex)(hexNumber)).toBe("00000000");
    });
    test("convert a number integer in hexadecimal(little-endian)", () => {
        let hexNumber = (0, index_1.numberToHexLE)(1, 32); // 32bits
        expect((0, index_1.bytesToHex)(hexNumber)).toBe("01000000");
        hexNumber = (0, index_1.numberToHexLE)(0, 32);
        expect((0, index_1.bytesToHex)(hexNumber)).toBe("00000000");
    });
    test("generate script from hash160", () => {
        let scripthash = "18ba14b3682295cb05230e31fecb000892406608";
        let script = (0, index_1.hash160ToScript)(scripthash);
        expect(script).toBe("76a91418ba14b3682295cb05230e31fecb00089240660888ac");
        script = (0, index_1.hash160ToScript)("6bf19e55f94d986b4640c154d864699341919511");
        expect(script).toBe("76a9146bf19e55f94d986b4640c154d86469934191951188ac");
    });
    test("convert hexadecimal string bytes in little-endian", () => {
        let little = (0, index_1.reverseHexLE)(new Uint8Array([0xff, 0x80, 0x99]));
        expect((0, index_1.bytesToHex)(little)).toBe("9980ff");
    });
    test("merge Uint8Arrays", () => {
        let arr1 = new Uint8Array([0x01, 0x05]);
        let arr2 = new Uint8Array([0x55, 0xff]);
        let result = (0, index_1.mergeUint8Arrays)(arr1, arr2);
        expect(result.length).toBe(4);
        expect(result[0]).toBe(0x01);
        expect(result[3]).toBe(0xff);
    });
    test("compare Uint8Arrays isEqual", () => {
        let arr1 = new Uint8Array([0x55, 0xff, 0xf1]);
        let arr2 = new Uint8Array([0x06, 0xf5, 0x88]);
        let result = (0, index_1.isEqual)(arr1, arr2);
        expect(false).toBe(result);
        result = (0, index_1.isEqual)(arr1, arr1, arr1);
        expect(true).toBe(result);
        result = (0, index_1.isEqual)(arr1, arr1, arr1, arr2);
        expect(false).toBe(result);
    });
    test("convert a number to little-endian varint", () => {
        let result = (0, index_1.numberToVarTnt)(250);
        expect("fa").toBe((0, index_1.bytesToHex)(result));
        result = (0, index_1.numberToVarTnt)(255);
        expect("fdff");
        result = (0, index_1.numberToVarTnt)(300);
        expect("fd2c01");
    });
    test("getBytesCount from hex", () => {
        let result = (0, index_1.getBytesCount)("ffff");
        expect(2).toBe(result);
        result = (0, index_1.getBytesCount)("ffffffff");
        expect(4).toBe(result);
    });
    test("hash256 sha256(sha256(content))", () => {
        const hash = (0, index_1.hash256)((0, index_1.hexToBytes)("ffff"));
        expect((0, index_1.bytesToHex)(hash)).toBe("fb8d65a41e2f8c97a133f779f5df09b6c5d4ced416f378ef99eea3d86d2b2dfd");
    });
});
//# sourceMappingURL=index.test.js.map