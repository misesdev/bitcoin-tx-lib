"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scriptPubkeyToScriptCode = exports.pubkeyToScriptCode = exports.addressToScriptPubKey = void 0;
const bech32_1 = require("bech32");
const _1 = require(".");
const base58_1 = require("../base/base58");
const opcodes_1 = require("../constants/opcodes");
function addressToScriptPubKey(address) {
    if (["1", "m", "n"].includes(address[0])) {
        // P2PKH Legacy
        const decoded = (0, _1.hexToBytes)(base58_1.Base58.decode(address));
        const hash = decoded.slice(1, -4); // remove the prefix and checksum
        const prefixScript = new Uint8Array([opcodes_1.OP_CODES.OP_DUP, opcodes_1.OP_CODES.OP_HASH160, hash.length]);
        const sufixScript = new Uint8Array([opcodes_1.OP_CODES.OP_EQUALVERIFY, opcodes_1.OP_CODES.OP_CHECKSIG]);
        return (0, _1.mergeUint8Arrays)(prefixScript, hash, sufixScript);
        // wallet not support this type of transaction 
        // } else if (["2", "3"].includes(address[0])) {
        //     // P2SH Legacy
        //     const decoded = hexToBytes(Base58.decode(address))
        //     const hash = decoded.slice(1, -4) // remove the prefix and checksum
        //     const prefixScript = new Uint8Array([OP_CODES.OP_HASH160, hash.length])
        //     const sufixScript = new Uint8Array([OP_CODES.OP_EQUAL])
        //     return mergeUint8Arrays(prefixScript, hash, sufixScript)
        // } 
    }
    else if (["tb1", "bc1"].includes(address.substring(0, 3))) {
        // SegWit (P2WPKH, P2WSH)
        const data = bech32_1.bech32.decode(address);
        const hash = new Uint8Array(bech32_1.bech32.fromWords(data.words.slice(1)));
        if (hash) {
            const prefixScript = new Uint8Array([opcodes_1.OP_CODES.OP_0, hash.length]);
            return (0, _1.mergeUint8Arrays)(prefixScript, hash);
        }
        throw new Error("Invalid bech32 format address");
    }
    throw new Error("not supported format address or type of transaction");
}
exports.addressToScriptPubKey = addressToScriptPubKey;
function pubkeyToScriptCode(pubkey) {
    const hash = (0, _1.ripemd160)((0, _1.hexToBytes)(pubkey), true);
    const prefixScript = new Uint8Array([opcodes_1.OP_CODES.OP_DUP, opcodes_1.OP_CODES.OP_HASH160, hash.length]);
    const sufixScript = new Uint8Array([opcodes_1.OP_CODES.OP_EQUALVERIFY, opcodes_1.OP_CODES.OP_CHECKSIG]);
    const script = (0, _1.mergeUint8Arrays)(prefixScript, hash, sufixScript);
    const scriptLength = new Uint8Array([script.length]);
    return (0, _1.bytesToHex)((0, _1.mergeUint8Arrays)(scriptLength, script));
}
exports.pubkeyToScriptCode = pubkeyToScriptCode;
function scriptPubkeyToScriptCode(script) {
    const scriptPubkey = (0, _1.hexToBytes)(script);
    if (scriptPubkey[0] == 0x00 && scriptPubkey[1] == 0x14) {
        const hash = scriptPubkey.slice(2);
        const prefixScript = new Uint8Array([opcodes_1.OP_CODES.OP_DUP, opcodes_1.OP_CODES.OP_HASH160, hash.length]);
        const sufixScript = new Uint8Array([opcodes_1.OP_CODES.OP_EQUALVERIFY, opcodes_1.OP_CODES.OP_CHECKSIG]);
        const scriptCode = (0, _1.mergeUint8Arrays)(prefixScript, hash, sufixScript);
        return (0, _1.bytesToHex)((0, _1.mergeUint8Arrays)(new Uint8Array([scriptCode.length]), scriptCode));
    }
    if (scriptPubkey[0] == 0x79 && scriptPubkey[2] == 0x14) {
        return (0, _1.bytesToHex)((0, _1.mergeUint8Arrays)(new Uint8Array([scriptPubkey.length]), scriptPubkey));
    }
    throw new Error("scriptPubkey no segwit, expected P2WPKH");
}
exports.scriptPubkeyToScriptCode = scriptPubkeyToScriptCode;
// export function scroptPubkeyValidation(script: string) : string {
// }
//# sourceMappingURL=txutils.js.map