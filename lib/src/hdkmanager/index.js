"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDKManager = void 0;
const bip32_1 = require("@scure/bip32");
const utils_1 = require("../utils");
const bip39_1 = require("bip39");
const ecpairkey_1 = require("../ecpairkey");
/**
 * Manages BIP44 HD wallet derivation from a master seed or mnemonic.
 */
class HDKManager {
    /**
     * Creates a new HDKManager from a master seed.
     * @param params Object containing master seed and optional BIP44 path values.
     */
    constructor(params) {
        var _a, _b, _c, _d;
        this.root = bip32_1.HDKey.fromMasterSeed(params.masterSeed);
        this.purpose = (_a = params.purpose) !== null && _a !== void 0 ? _a : 44;
        this.coinType = (_b = params.coinType) !== null && _b !== void 0 ? _b : 0;
        this.account = (_c = params.account) !== null && _c !== void 0 ? _c : 0;
        this.change = (_d = params.change) !== null && _d !== void 0 ? _d : 0;
    }
    /**
     * Instantiates HDKManager from a hex-encoded master seed.
     * @param seed Hex string master seed.
     */
    static fromMasterSeed(seed) {
        return new HDKManager({ masterSeed: (0, utils_1.hexToBytes)(seed) });
    }
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     * @param mnemonic Mnemonic phrase.
     * @param password Optional BIP39 passphrase.
     */
    static fromMnemonic(mnemonic, password = "") {
        const masterSeed = (0, bip39_1.mnemonicToSeedSync)(mnemonic, password);
        return new HDKManager({ masterSeed });
    }
    /**
     * Derives a private key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw private key as Uint8Array.
     */
    derivatePrivateKey(index) {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        let path = this.getDerivationPath(index);
        let child = this.root.derive(path);
        if (!child.privateKey)
            throw new Error(`Missing private key at path ${path}`);
        return child.privateKey;
    }
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePrivateKeys(quantity) {
        let result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePrivateKey(i));
        }
        return result;
    }
    /**
     * Derives an ECPairKey from a private key at a specific index.
     * @param index Index in the derivation path.
     * @param options with network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivatePairKey(index, options) {
        var _a;
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        let privateKey = (0, utils_1.bytesToHex)(this.derivatePrivateKey(index));
        return ecpairkey_1.ECPairKey.fromHex({ privateKey, network: (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet" });
    }
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     * @param quantity Number of pair keys to derive.
     * @param network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivateMultiplePairKeys(quantity, options) {
        var _a;
        let result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePairKey(i, { network: (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet" }));
        }
        return result;
    }
    /**
     * Returns the full BIP44 derivation path for a given index.
     * @param index Index to complete the path.
     */
    getDerivationPath(index) {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        return `m/${this.purpose}'/${this.coinType}'/${this.account}'/${this.change}/${index}`;
    }
}
exports.HDKManager = HDKManager;
//# sourceMappingURL=index.js.map