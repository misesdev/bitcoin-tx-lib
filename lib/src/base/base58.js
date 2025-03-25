"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base58 = void 0;
const utils_1 = require("../utils");
class Base58 {
    static encode(hex) {
        if (!!!hex)
            throw new Error("hex is undefined or empty!");
        if (hex.length % 2 !== 0)
            throw new Error("Invalid hex value!");
        let bytes = (0, utils_1.hexToBytes)(hex);
        let num = BigInt('0x' + hex);
        let encoded = '';
        while (num > 0) {
            let remainder = num % this.BASE;
            num = num / this.BASE;
            encoded = this.ALPHABET[Number(remainder)] + encoded;
        }
        for (let byte of bytes) {
            if (byte === 0) {
                encoded = this.ALPHABET[0] + encoded;
            }
            else {
                break;
            }
        }
        return encoded;
    }
    static decode(value) {
        let num = BigInt(0);
        for (let char of value) {
            num = num * this.BASE + BigInt(this.ALPHABET.indexOf(char));
        }
        let hex = num.toString(16);
        if (hex.length % 2) {
            hex = '0' + hex;
        }
        let bytes = (0, utils_1.hexToBytes)(hex);
        // Add leading zeros
        let leadingZeroes = 0;
        for (let char of value) {
            if (char === this.ALPHABET[0]) {
                leadingZeroes++;
            }
            else {
                break;
            }
        }
        let output = new Uint8Array(leadingZeroes + bytes.length);
        output.set(bytes, leadingZeroes);
        return (0, utils_1.bytesToHex)(output);
    }
}
exports.Base58 = Base58;
_a = Base58;
Base58.ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
Base58.BASE = BigInt(_a.ALPHABET.length);
//# sourceMappingURL=base58.js.map