"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECPairKey = void 0;
const Ecc = require('elliptic').ec;
const base58_1 = require("./base/base58");
const utils_1 = require("./utils");
const secp256k1_1 = require("@noble/curves/secp256k1");
const address_1 = require("./utils/address");
class ECPairKey {
    constructor(options) {
        var _a, _b, _c;
        this.network = "mainnet";
        this.cipherCurve = "secp256k1";
        // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
        this.addressPrefix = { "mainnet": 0x00, "testnet": 0x6f };
        this.elliptic = new Ecc((_a = this.cipherCurve) !== null && _a !== void 0 ? _a : "secp256k1");
        this.network = (_b = options === null || options === void 0 ? void 0 : options.network) !== null && _b !== void 0 ? _b : "mainnet";
        this.privateKey = (_c = options === null || options === void 0 ? void 0 : options.privateKey) !== null && _c !== void 0 ? _c : this.elliptic.genKeyPair().getPrivate("hex");
    }
    getPublicKey() {
        const keyPair = this.elliptic.keyFromPrivate(this.privateKey);
        const pubPoint = keyPair.getPublic();
        return pubPoint.encode("hex");
    }
    getPublicKeyCompressed(type = "base58") {
        let publicKey = this.getPublicKey();
        let coordinateX = publicKey.substring(2, 66);
        let coordinateY = publicKey.substring(66);
        const lastByteY = parseInt(coordinateY.slice(-2), 16);
        const prefix = (lastByteY % 2 === 0) ? "02" : "03";
        // The prefix byte 0x02 is due to the fact that the key refers to the X coordinate of the curve
        let publicKeyCompressed = prefix + coordinateX;
        if (type == "hex")
            return publicKeyCompressed;
        return base58_1.Base58.encode(publicKeyCompressed);
    }
    signDER(messageHash) {
        let data = messageHash;
        if (typeof (messageHash) !== "object")
            data = (0, utils_1.hexToBytes)(messageHash);
        // generate signatures until it is small
        while (true) {
            let signature = secp256k1_1.secp256k1.sign(data, this.privateKey, { extraEntropy: true });
            if (signature.hasHighS())
                signature.normalizeS();
            if (signature.toDERRawBytes()[1] == 0x44)
                return signature.toDERHex();
        }
    }
    verifySignature(messageHash, derSignature) {
        let message = messageHash;
        let signature = derSignature;
        if (typeof (messageHash) !== "string")
            message = (0, utils_1.bytesToHex)(messageHash);
        if (typeof (derSignature) !== "string")
            signature = (0, utils_1.bytesToHex)(derSignature);
        return secp256k1_1.secp256k1.verify(signature, message, this.getPublicKeyCompressed("hex"));
    }
    getWif() {
        // the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
        let prefix = (0, utils_1.numberToHex)(ECPairKey.wifPrefixes[this.network], 8, "hex");
        let privateWif = prefix + this.privateKey;
        let check = (0, utils_1.checksum)(privateWif);
        let wif = privateWif + check;
        return base58_1.Base58.encode(wif);
    }
    getPublicWif() {
        // 0x80 is prefix for mainnet and 0xef is byte prefix for testnet
        let prefix = (0, utils_1.numberToHex)(ECPairKey.wifPrefixes[this.network], 8, "hex");
        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        let publicWif = prefix + this.privateKey + "01";
        let check = (0, utils_1.checksum)(publicWif);
        let wif = publicWif + check;
        return base58_1.Base58.encode(wif);
    }
    getAddress(type = "p2wpkh") {
        let pubkey = this.getPublicKeyCompressed("hex");
        return address_1.Address.fromPubkey({ pubkey, type, network: this.network });
    }
    static fromWif(wif, options) {
        let wifHex = base58_1.Base58.decode(wif);
        if (!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.");
        return new ECPairKey({ privateKey: wifHex.substring(2, wifHex.length - 8), network: options === null || options === void 0 ? void 0 : options.network });
    }
    static fromHex({ privateKey, network = "mainnet" }) {
        return new ECPairKey({ privateKey, network });
    }
    static verifyWif(wifHex) {
        let bytes = (0, utils_1.hexToBytes)(wifHex);
        // In hex [0x80]
        if (![this.wifPrefixes.mainnet, this.wifPrefixes.testnet].includes(bytes[0]))
            return false;
        let checksumBytes = bytes.slice(bytes.length - 4, bytes.length); //wifHex.substring(wifHex.length - 8)
        let checksumHash = (0, utils_1.checksum)(bytes.slice(0, bytes.length - 4)); //wifHex.substring(0, wifHex.length - 8)
        if (checksumHash.toString() !== checksumBytes.toString())
            return false;
        return true;
    }
}
exports.ECPairKey = ECPairKey;
// the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
ECPairKey.wifPrefixes = { "mainnet": 0x80, "testnet": 0xef };
//# sourceMappingURL=ecpairkey.js.map