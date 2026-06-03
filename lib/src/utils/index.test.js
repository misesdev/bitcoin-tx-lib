"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
describe("utils", () => {
    describe("bytesToHex", () => {
        test("converts byte array to hex string with correct padding", () => {
            const bytes = new Uint8Array([5, 128, 255, 255]);
            expect((0, index_1.bytesToHex)(bytes)).toBe("0580ffff");
        });
        test("single byte with leading zero is padded to 2 chars", () => {
            expect((0, index_1.bytesToHex)(new Uint8Array([0x0a]))).toBe("0a");
            expect((0, index_1.bytesToHex)(new Uint8Array([0x00]))).toBe("00");
        });
        test("throws on empty array", () => {
            expect(() => (0, index_1.bytesToHex)(new Uint8Array())).toThrow();
        });
    });
    describe("hexToBytes", () => {
        test("converts hex string to byte array correctly", () => {
            const bytes = (0, index_1.hexToBytes)("0580ffff");
            expect(bytes[0]).toBe(5);
            expect(bytes[1]).toBe(128);
            expect(bytes[2]).toBe(255);
            expect(bytes[3]).toBe(255);
            expect(bytes.length).toBe(4);
        });
        test("round-trips with bytesToHex", () => {
            const original = "deadbeef01020304";
            expect((0, index_1.bytesToHex)((0, index_1.hexToBytes)(original))).toBe(original);
        });
        test("throws on empty string", () => {
            expect(() => (0, index_1.hexToBytes)("")).toThrow();
        });
        test("throws on odd-length hex string", () => {
            expect(() => (0, index_1.hexToBytes)("80ff05f")).toThrow();
            expect(() => (0, index_1.hexToBytes)("f")).toThrow();
            expect(() => (0, index_1.hexToBytes)("abc")).toThrow();
        });
    });
    describe("sha256 and hash256", () => {
        test("sha256 returns 32 bytes", () => {
            const hash = (0, index_1.sha256)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"));
            expect(hash.length).toBe(32);
        });
        test("sha256 double-hash (hash256 flag) known vector", () => {
            const hash = (0, index_1.sha256)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"), true);
            expect((0, index_1.bytesToHex)(hash)).toBe("507a5b8dfed0fc6fe8801743720cedec06aa5c6fca72b07c49964492fb98a714");
        });
        test("hash256 known vector", () => {
            const hash = (0, index_1.hash256)((0, index_1.hexToBytes)("ffff"));
            expect((0, index_1.bytesToHex)(hash)).toBe("fb8d65a41e2f8c97a133f779f5df09b6c5d4ced416f378ef99eea3d86d2b2dfd");
        });
        test("same input always produces same hash256", () => {
            const input = (0, index_1.hexToBytes)("aabbcc");
            expect((0, index_1.bytesToHex)((0, index_1.hash256)(input))).toBe((0, index_1.bytesToHex)((0, index_1.hash256)(input)));
        });
    });
    describe("checksum", () => {
        test("known checksum vector (first 4 bytes of double SHA-256)", () => {
            const cs = (0, index_1.checksum)((0, index_1.hexToBytes)("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"));
            expect((0, index_1.bytesToHex)(cs)).toBe("507a5b8d");
            expect(cs.length).toBe(4);
        });
    });
    describe("ripemd160", () => {
        test("ripemd160 of a known sha256 hash", () => {
            const sha = (0, index_1.hexToBytes)("6b23c0eabc34e97f4b5f8c2277d6b7f6869b16dfb4f2c284b94efc13a3d81b0c");
            expect((0, index_1.bytesToHex)((0, index_1.ripemd160)(sha))).toBe("825e1e77af4ea56228f2c96385dc24d9ba788a8c");
        });
        test("ripemd160 with address flag performs sha256 first", () => {
            const sha = (0, index_1.hexToBytes)("6b23c0eabc34e97f4b5f8c2277d6b7f6869b16dfb4f2c284b94efc13a3d81b0c");
            expect((0, index_1.bytesToHex)((0, index_1.ripemd160)(sha, true))).toBe("58077dda57de14ac9f055c64bf3c71ff0b5796da");
        });
    });
    describe("numberToHex and numberToHexLE", () => {
        test("numberToHex big-endian 32-bit", () => {
            expect((0, index_1.bytesToHex)((0, index_1.numberToHex)(1, 32))).toBe("00000001");
            expect((0, index_1.bytesToHex)((0, index_1.numberToHex)(0, 32))).toBe("00000000");
        });
        test("numberToHexLE little-endian 32-bit", () => {
            expect((0, index_1.bytesToHex)((0, index_1.numberToHexLE)(1, 32))).toBe("01000000");
            expect((0, index_1.bytesToHex)((0, index_1.numberToHexLE)(0, 32))).toBe("00000000");
        });
        test("numberToHexLE 64-bit (8 bytes)", () => {
            expect((0, index_1.bytesToHex)((0, index_1.numberToHexLE)(1, 64))).toBe("0100000000000000");
        });
    });
    describe("numberToVarint", () => {
        test("values < 0xfd are encoded as a single byte (no prefix)", () => {
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(0))).toBe("00");
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(1))).toBe("01");
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(250))).toBe("fa");
            // max single-byte value is 0xfc = 252
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(0xfc))).toBe("fc");
        });
        test("0xfd–0xffff range uses fd prefix + 2-byte LE", () => {
            // 255 = 0xff → LE 16-bit = ff 00
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(255))).toBe("fdff00");
            // 300 = 0x012c → LE 16-bit = 2c 01
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(300))).toBe("fd2c01");
            // 0xffff → LE 16-bit = ff ff
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(0xffff))).toBe("fdffff");
        });
        test("0x10000–0xffffffff range uses fe prefix + 4-byte LE", () => {
            // 65536 = 0x10000 → LE 32-bit = 00 00 01 00
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(0x10000))).toBe("fe00000100");
            // 0xffffffff → LE 32-bit = ff ff ff ff
            expect((0, index_1.bytesToHex)((0, index_1.numberToVarint)(0xffffffff))).toBe("feffffffff");
        });
        test("output length matches Bitcoin varint spec", () => {
            expect((0, index_1.numberToVarint)(100).length).toBe(1);
            expect((0, index_1.numberToVarint)(300).length).toBe(3);
            expect((0, index_1.numberToVarint)(70000).length).toBe(5);
        });
    });
    describe("getBytesCount", () => {
        test("returns correct byte count for even-length hex strings", () => {
            expect((0, index_1.getBytesCount)("ffff")).toBe(2);
            expect((0, index_1.getBytesCount)("ffffffff")).toBe(4);
            expect((0, index_1.getBytesCount)("0014" + "00".repeat(20))).toBe(22);
        });
        test("throws on odd-length hex string", () => {
            expect(() => (0, index_1.getBytesCount)("fff")).toThrow("invalid hexadecimal string value");
            expect(() => (0, index_1.getBytesCount)("f")).toThrow("invalid hexadecimal string value");
        });
    });
    describe("hash160ToScript", () => {
        test("produces correct P2PKH scriptPubKey from hash160 hex string", () => {
            expect((0, index_1.hash160ToScript)("18ba14b3682295cb05230e31fecb000892406608"))
                .toBe("76a91418ba14b3682295cb05230e31fecb00089240660888ac");
            expect((0, index_1.hash160ToScript)("6bf19e55f94d986b4640c154d864699341919511"))
                .toBe("76a9146bf19e55f94d986b4640c154d86469934191951188ac");
        });
        test("produces Uint8Array output when input is Uint8Array", () => {
            const hash = (0, index_1.hexToBytes)("18ba14b3682295cb05230e31fecb000892406608");
            const result = (0, index_1.hash160ToScript)(hash);
            expect(result).toBeInstanceOf(Uint8Array);
        });
    });
    describe("mergeUint8Arrays", () => {
        test("merges multiple arrays in order", () => {
            const result = (0, index_1.mergeUint8Arrays)(new Uint8Array([0x01, 0x05]), new Uint8Array([0x55, 0xff]));
            expect(result.length).toBe(4);
            expect(result[0]).toBe(0x01);
            expect(result[3]).toBe(0xff);
        });
        test("merging empty arrays produces empty result", () => {
            const result = (0, index_1.mergeUint8Arrays)(new Uint8Array([]), new Uint8Array([]));
            expect(result.length).toBe(0);
        });
    });
    describe("isEqual", () => {
        test("returns false for unequal arrays", () => {
            const a = new Uint8Array([0x55, 0xff, 0xf1]);
            const b = new Uint8Array([0x06, 0xf5, 0x88]);
            expect((0, index_1.isEqual)(a, b)).toBe(false);
        });
        test("returns true when all arrays are equal", () => {
            const a = new Uint8Array([0x55, 0xff, 0xf1]);
            expect((0, index_1.isEqual)(a, a, a)).toBe(true);
        });
        test("returns false when any array differs", () => {
            const a = new Uint8Array([0x55, 0xff, 0xf1]);
            const b = new Uint8Array([0x06, 0xf5, 0x88]);
            expect((0, index_1.isEqual)(a, a, a, b)).toBe(false);
        });
    });
});
//# sourceMappingURL=index.test.js.map