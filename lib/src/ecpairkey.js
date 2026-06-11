"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECPairKey = void 0;
const utils_1 = require("./utils");
const secp256k1_1 = require("@noble/curves/secp256k1");
const address_1 = require("./utils/address");
const base_1 = require("@scure/base");
class ECPairKey {
    constructor(options) {
        var _a, _b, _c;
        this.network = (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet";
        this.type = (_b = options === null || options === void 0 ? void 0 : options.type) !== null && _b !== void 0 ? _b : "p2wpkh";
        this.privateKey = (_c = options === null || options === void 0 ? void 0 : options.privateKey) !== null && _c !== void 0 ? _c : secp256k1_1.secp256k1.utils.randomPrivateKey();
    }
    /**
    * Returns the compressed public key derived from the private key.
    */
    getPublicKey() {
        return secp256k1_1.secp256k1.getPublicKey(this.privateKey, true);
    }
    getPrivateKey() {
        return this.privateKey;
    }
    /**
    * Signs a message hash and returns the DER-encoded signature.
    * @param message Hash of the message to sign.
    */
    signDER(message) {
        const signature = secp256k1_1.secp256k1.sign(message, this.privateKey, {
            extraEntropy: true,
            lowS: true
        });
        return signature.toDERRawBytes();
    }
    /**
    * Verifies a DER-encoded signature against a message hash.
    * @param message Message hash that was signed.
    * @param signature Signature in DER format.
    */
    verifySignature(message, signature) {
        return secp256k1_1.secp256k1.verify(signature, message, this.getPublicKey());
    }
    /**
    * Returns the WIF (Wallet Import Format) of the private key.
    * The 0x01 suffix indicates the key produces a compressed public key,
    * which is required for compatibility with standard Bitcoin wallets.
    */
    getWif() {
        const prefix = ECPairKey.wifPrefixes[this.network];
        const payload = new Uint8Array([prefix, ...this.privateKey, 0x01]);
        const check = (0, utils_1.checksum)(payload);
        const privateWif = new Uint8Array([...payload, ...check]);
        return base_1.base58.encode(privateWif);
    }
    /**
   * Returns the address associated with the compressed public key.
   * @param type Type of address to generate (p2pkh, p2wpkh, etc).
   */
    getAddress(type = this.type) {
        let pubkey = (0, utils_1.bytesToHex)(this.getPublicKey());
        return address_1.Address.fromPubkey({ pubkey, type, network: this.network });
    }
    /**
    * Creates a key pair from a WIF string.
    * @param wif Wallet Import Format string.
    * @param options Optional network override.
    */
    static fromWif(wif) {
        const decoded = base_1.base58.decode(wif);
        if (!this.verifyWif(decoded))
            throw new Error("Wif type is invalid or not supported, only private key wif are suported");
        const keyBytes = decoded.slice(1, 33);
        const network = (decoded[0] === this.wifPrefixes.mainnet ? "mainnet" : "testnet");
        return new ECPairKey({ privateKey: keyBytes, network });
    }
    /**
    * Creates a key pair from a raw private key.
    */
    static fromHex(privateKey, network = "mainnet") {
        return new ECPairKey({ privateKey: (0, utils_1.hexToBytes)(privateKey), network });
    }
    /**
    * Verifies if a WIF string (decoded) has valid prefix and checksum.
    * @param bytes WIF decoded into bytes.
    */
    static verifyWif(decoded) {
        const prefix = decoded[0];
        const isValidPrefix = Object.values(this.wifPrefixes).includes(prefix);
        if (!isValidPrefix)
            return false;
        const payload = decoded.slice(0, -4);
        const providedChecksum = decoded.slice(-4);
        const validChecksum = (0, utils_1.checksum)(payload);
        return providedChecksum.every((b, i) => b === validChecksum[i]);
    }
    getPrivateKeyHex() {
        return (0, utils_1.bytesToHex)(this.privateKey);
    }
    getPublicKeyHex() {
        return (0, utils_1.bytesToHex)(this.getPublicKey());
    }
}
exports.ECPairKey = ECPairKey;
// the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
ECPairKey.wifPrefixes = { mainnet: 0x80, testnet: 0xef };
//# sourceMappingURL=ecpairkey.js.map