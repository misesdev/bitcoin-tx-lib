"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBytesCount = exports.numberToVarTnt = exports.isEqual = exports.mergeUint8Arrays = exports.reverseHexLE = exports.hash160ToScript = exports.numberToHexLE = exports.numberToHex = exports.reverseEndian = exports.checksum = exports.ripemd160 = exports.hash256 = exports.sha256 = exports.hexToBytes = exports.bytesToHex = void 0;
const opcodes_1 = require("../constants/opcodes");
const ripemd160_1 = require("@noble/hashes/ripemd160");
const sha256_1 = require("@noble/hashes/sha256");
function bytesToHex(bytes) {
    if (bytes.length <= 0)
        throw new Error("The byte array is empty!");
    if (typeof (bytes) == "string")
        throw new Error("Expected the type Uint8Array");
    let hexValue = "";
    bytes.forEach(byte => {
        let hexNumber = byte.toString(16);
        if (hexNumber.length == 1)
            hexNumber = "0" + hexNumber;
        hexValue += hexNumber;
    });
    return hexValue;
}
exports.bytesToHex = bytesToHex;
function hexToBytes(hex, hexadecimal = true) {
    if (hex.length <= 0)
        throw new Error("hex value is empty");
    if (hexadecimal && hex.length % 2 !== 0)
        throw new Error("Invalid hex value!");
    let bytes = new Uint8Array(hexadecimal ? hex.length / 2 : hex.length);
    for (let i = 0; i <= hex.length; i += hexadecimal ? 2 : 1) {
        if (hexadecimal)
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
        else
            bytes[i] = hex.charCodeAt(i);
    }
    return bytes;
}
exports.hexToBytes = hexToBytes;
function sha256(messageHash, hash256 = false) {
    let data = messageHash;
    if (typeof (messageHash) !== "object")
        data = hexToBytes(messageHash);
    let hash = (0, sha256_1.sha256)(data);
    // if is a hash256 return sha256(sha256(content)) (doc: https://en.bitcoin.it/wiki/BIP_0174)
    if (hash256)
        hash = (0, sha256_1.sha256)(hash);
    if (typeof (messageHash) == "string")
        return bytesToHex(hash);
    return hash;
}
exports.sha256 = sha256;
function hash256(message) {
    let data = message;
    if (typeof (message) !== "object")
        data = hexToBytes(message);
    const hash = (0, sha256_1.sha256)((0, sha256_1.sha256)(data));
    if (typeof (message) == "string")
        return bytesToHex(hash);
    return hash;
}
exports.hash256 = hash256;
function ripemd160(messageHash, address = false) {
    let data = messageHash;
    if (typeof (messageHash) !== "object")
        data = hexToBytes(messageHash);
    let hash = address ? sha256(data) : data;
    hash = (0, ripemd160_1.ripemd160)(hash);
    if (typeof (messageHash) == "string")
        return bytesToHex(hash);
    return hash;
}
exports.ripemd160 = ripemd160;
function checksum(messageHash, bytes = 4) {
    let data = messageHash;
    if (typeof (messageHash) !== "object")
        data = hexToBytes(messageHash);
    // generate the hash256(sha256(content)) and return first 4 bytes (doc: https://en.bitcoin.it/wiki/BIP_0174)
    let hash = (0, sha256_1.sha256)(data);
    hash = (0, sha256_1.sha256)(hash).slice(0, bytes); //.substring(0, bytes * 2)
    if (typeof (messageHash) == "string")
        return bytesToHex(hash);
    return hash;
}
exports.checksum = checksum;
function reverseEndian(hex) {
    if (typeof (hex) == "object")
        return hex.reverse();
    let hexLE = "";
    for (let i = hex.length; i > 0; i -= 2)
        hexLE += hex[i - 2] + hex[i - 1];
    return hexLE;
}
exports.reverseEndian = reverseEndian;
function numberToHex(number = 0, bits = 64, result = "hex") {
    let hexValue = number.toString(16); // string hexadecimal
    if (hexValue.length == 1)
        hexValue = "0" + hexValue;
    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = "0" + hexValue;
    }
    if (result == "hex")
        return hexValue;
    return hexToBytes(hexValue);
}
exports.numberToHex = numberToHex;
// Convert a integer number in Uint8Array(16) // 64 bits little-endian
function numberToHexLE(number = 0, bits = 64, result = "hex") {
    bits = bits < 8 ? 8 : bits;
    let hexValue = number.toString(16); // string hexadecimal
    for (let i = hexValue.length; i < bits / 4; i++)
        hexValue = "0" + hexValue;
    if (result == "hex")
        return reverseEndian(hexValue);
    return hexToBytes(hexValue).reverse();
}
exports.numberToHexLE = numberToHexLE;
function hash160ToScript(hash160) {
    let data = hash160;
    if (typeof (hash160) !== "object")
        data = hexToBytes(hash160);
    let hash160Length = data.length; // 0x14 == 20 && 0x20 == 34
    // OP_DUP+OP_HASH160+PK_HASH_LENGTH+PUBKEY_HASH+OP_EQUALVERIFY+OP_CHECKSIG
    let hexScript = mergeUint8Arrays(new Uint8Array([
        opcodes_1.OP_CODES.OP_DUP,
        opcodes_1.OP_CODES.OP_HASH160,
        hash160Length
    ]), data, new Uint8Array([
        opcodes_1.OP_CODES.OP_EQUALVERIFY,
        opcodes_1.OP_CODES.OP_CHECKSIG
    ]));
    if (typeof (hash160) == "string")
        return bytesToHex(hexScript);
    return hexScript;
}
exports.hash160ToScript = hash160ToScript;
function reverseHexLE(hex, isBytes = true) {
    if (isBytes && hex.length <= 0)
        throw new Error("Invalid hex value!");
    if (typeof (hex) == "object")
        return hex.reverse();
    let hexLE = '';
    for (let i = hex.length; i > 0; i -= 2)
        hexLE += hex[i - 2] + hex[i - 1];
    // return hexadecimal bytes in little-endian
    return hexLE;
}
exports.reverseHexLE = reverseHexLE;
function mergeUint8Arrays(...arrays) {
    let length = arrays.reduce((sum, e) => sum + e.length, 0);
    let mergeArray = new Uint8Array(length);
    arrays.forEach((array, index, arrays) => {
        let offset = arrays.slice(0, index).reduce((acc, e) => acc + e.length, 0);
        mergeArray.set(array, offset);
    });
    return mergeArray;
}
exports.mergeUint8Arrays = mergeUint8Arrays;
function isEqual(...arrays) {
    let result = true;
    arrays.forEach((arr, index, arrays) => {
        if (index < arrays.length - 1) {
            if (arr.toString() !== arrays[arrays.length - 1].toString())
                result = false;
        }
    });
    return result;
}
exports.isEqual = isEqual;
function numberToVarTnt(value, resultType = "hex") {
    let result;
    if (value < 0xfd) {
        result = new Uint8Array([value]);
    }
    else if (value <= 0xffff) {
        var number = numberToHexLE(value, 16, "bytes");
        result = mergeUint8Arrays(new Uint8Array([0xfd]), number);
    }
    else if (value <= 0xffffffff) {
        let number = numberToHexLE(value, 32, "bytes");
        result = mergeUint8Arrays(new Uint8Array([0xfe]), number);
    }
    else {
        let number = numberToHexLE(value, 64, "bytes");
        result = mergeUint8Arrays(new Uint8Array([0xff]), number);
    }
    if (resultType == "hex")
        return bytesToHex(result);
    return result;
}
exports.numberToVarTnt = numberToVarTnt;
function getBytesCount(hex) {
    return hex.length / 2;
}
exports.getBytesCount = getBytesCount;
//# sourceMappingURL=index.js.map