"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Address = void 0;
const bech32_1 = require("../base/bech32");
const _1 = require(".");
const base_1 = require("@scure/base");
const txutils_1 = require("./txutils");
const buffer_1 = require("./buffer");
class Address {
    static fromPubkey({ pubkey, type = "p2wpkh", network = "mainnet" }) {
        if ((0, _1.getBytesCount)(pubkey) != 33)
            throw new Error("invalid pubkey, expected a compressed format 33 bytes");
        if (type === "p2wpkh") {
            let bech32 = new bech32_1.Bech32({ publicKey: pubkey, network });
            return bech32.getAddress();
        }
        else {
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let builder = new buffer_1.ByteBuffer((0, _1.numberToHex)(this.addressPrefix[network], 8));
            builder.append((0, _1.ripemd160)((0, _1.hexToBytes)(pubkey), true));
            let checkHash = (0, _1.checksum)(builder.raw());
            builder.append(checkHash);
            return base_1.base58.encode(builder.raw());
        }
    }
    static fromHash({ ripemd160, type = "p2wpkh", network = "mainnet" }) {
        if ((0, _1.getBytesCount)(ripemd160) != 0x14)
            throw new Error("Invalid hash ripemd160");
        if (type === "p2wpkh") {
            let bech32 = new bech32_1.Bech32({ network });
            let complete = bech32.convert(ripemd160);
            return bech32.encode(complete);
        }
        else {
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let builder = new buffer_1.ByteBuffer((0, _1.numberToHex)(this.addressPrefix[network], 8));
            builder.append((0, _1.hexToBytes)(ripemd160));
            // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
            let checkHash = (0, _1.checksum)(builder.raw());
            builder.append(checkHash);
            return base_1.base58.encode(builder.raw());
        }
    }
    static getScriptPubkey(address) {
        return (0, _1.bytesToHex)((0, txutils_1.addressToScriptPubKey)(address));
    }
    static getRipemd160(address) {
        let script = (0, txutils_1.addressToScriptPubKey)(address);
        if (script[1] == 0x14 || script[1] == 0x20)
            return (0, _1.bytesToHex)(script.slice(2));
        if (script[0] == 0x76)
            return (0, _1.bytesToHex)(script.slice(3, -2));
        throw new Error("address not supported");
    }
    static isValid(address) {
        try {
            let script = (0, txutils_1.addressToScriptPubKey)(address);
            if (script[1] == 0x14 && script.slice(2).length != 0x14)
                return false;
            if (script[1] == 0x20 && script.slice(2).length != 0x20)
                return false;
            if (script[0] == 0x76 && script.slice(3, -2).length != 0x14)
                return false;
            return true;
        }
        catch (_a) {
            return false;
        }
    }
}
exports.Address = Address;
Address.addressPrefix = { "mainnet": 0x00, "testnet": 0x6f };
//# sourceMappingURL=address.js.map