"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDKManager = void 0;
const bip32_1 = require("@scure/bip32");
const utils_1 = require("../utils");
const bip39_1 = require("@scure/bip39");
const ecpairkey_1 = require("../ecpairkey");
/**
 * Manages BIP44 HD keys derivation from a master seed or mnemonic.
 */
class HDKManager {
    /**
     * Creates a new HDKManager from a master seed.
     * @param params Object containing master seed and optional BIP44 path values.
     */
    constructor(params) {
        var _a, _b, _c, _d;
        this._rootKey = params.rootKey;
        this.purpose = (_a = params.purpose) !== null && _a !== void 0 ? _a : 84;
        this.coinType = (_b = params.coinType) !== null && _b !== void 0 ? _b : 0;
        this.account = (_c = params.account) !== null && _c !== void 0 ? _c : 0;
        this.change = (_d = params.change) !== null && _d !== void 0 ? _d : 0;
    }
    /**
     * Instantiates HDKManager from a hex-encoded master seed.
     * @param seed Hex string master seed.
     */
    static fromMasterSeed(masterSeed, options) {
        const rootKey = bip32_1.HDKey.fromMasterSeed(masterSeed, this.getVersion(options));
        return new HDKManager({ rootKey });
    }
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     * @param mnemonic Mnemonic phrase.
     * @param password Optional BIP39 passphrase.
     */
    static fromMnemonic(mnemonic, passphrase, options) {
        const masterSeed = (0, bip39_1.mnemonicToSeedSync)(mnemonic, passphrase);
        const rootKey = bip32_1.HDKey.fromMasterSeed(masterSeed, this.getVersion(options));
        return new HDKManager({ rootKey });
    }
    /**
     * Creates an instance from an extended private key (xpriv).
     */
    static fromXPriv(xpriv, pathParams = {}) {
        const rootKey = bip32_1.HDKey.fromExtendedKey(xpriv);
        if (!rootKey.privateKey)
            throw new Error("Provided xpriv is invalid or missing private key");
        return new HDKManager(Object.assign(Object.assign({}, pathParams), { rootKey }));
    }
    /**
     * Creates an instance from an extended public key (xpub).
     * Only public derivation will be available.
     */
    static fromXPub(xpub, pathParams = {}) {
        const rootKey = bip32_1.HDKey.fromExtendedKey(xpub);
        if (rootKey.privateKey)
            throw new Error("xpub should not contain a private key");
        return new HDKManager(Object.assign(Object.assign({}, pathParams), { rootKey }));
    }
    /**
     * Derives a private key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw private key as Uint8Array.
     */
    derivatePrivateKey(index, pathOptions) {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        let path = this.getDerivationPath(index, pathOptions);
        let child = this._rootKey.derive(path);
        if (!child.privateKey)
            throw new Error(`Missing private key at path ${path}`);
        return child.privateKey;
    }
    /**
     * Derives a public key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw public key as Uint8Array.
     */
    derivatePublicKey(index, pathOptions) {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        let path = this.getDerivationPath(index, pathOptions);
        let child = this._rootKey.derive(path);
        if (!child.publicKey)
            throw new Error(`Missing public key at path ${path}`);
        return child.publicKey;
    }
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePrivateKeys(quantity, pathOptions) {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        let result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePrivateKey(i, pathOptions));
        }
        return result;
    }
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePublicKeys(quantity, pathOptions) {
        let result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePublicKey(i, pathOptions));
        }
        return result;
    }
    /**
     * Derives an ECPairKey from a private key at a specific index.
     * @param index Index in the derivation path.
     * @param options with network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivatePairKey(index, options, pathOptions) {
        var _a;
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        let privateKey = (0, utils_1.bytesToHex)(this.derivatePrivateKey(index, pathOptions));
        return ecpairkey_1.ECPairKey.fromHex(privateKey, (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet");
    }
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     * @param quantity Number of pair keys to derive.
     * @param network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivateMultiplePairKeys(quantity, options, pathOptions) {
        var _a;
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        let result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePairKey(i, { network: (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet" }, pathOptions));
        }
        return result;
    }
    /**
     * Returns the full BIP44 derivation path for a given index.
     * @param index Index to complete the path.
     */
    getDerivationPath(index, pathOptions) {
        var _a, _b, _c;
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        // In watch only (imported from xpub) derive only this path
        if (!this.hasPrivateKey())
            return `m/${(_a = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.change) !== null && _a !== void 0 ? _a : this.change}/${index}`;
        // If have an a private key derive from hardened path
        return `
            m/${this.purpose}'
            /${this.coinType}'
            /${(_b = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.account) !== null && _b !== void 0 ? _b : this.account}'
            /${(_c = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.change) !== null && _c !== void 0 ? _c : this.change}
            /${index}`.replace(/\s+/g, "");
    }
    /**
     * Checks if the current root key has a private key.
     */
    hasPrivateKey() {
        return !!this._rootKey.privateKey;
    }
    /**
     * Return the master private key if exists(not imported from xpub)
     */
    getMasterPrivateKey() {
        if (!this._rootKey.privateKey)
            throw new Error("Missing private key");
        return this._rootKey.privateKey;
    }
    /**
     * Return the master public key
     */
    getMasterPublicKey() {
        if (!this._rootKey.publicKey)
            throw new Error("Missing public key");
        return this._rootKey.publicKey;
    }
    getXPriv() {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        return this._rootKey.privateExtendedKey;
    }
    getXPub() {
        return this._rootKey.publicExtendedKey;
    }
    static getVersion(options) {
        if ((options === null || options === void 0 ? void 0 : options.purpose) == 44)
            return this.bip44Versions;
        if ((options === null || options === void 0 ? void 0 : options.purpose) == 84)
            return this.bip84Versions;
        return this.bip84Versions;
    }
}
exports.HDKManager = HDKManager;
HDKManager.bip44Versions = { private: 0x0488ade4, public: 0x0488b21e };
HDKManager.bip84Versions = { private: 0x04b2430c, public: 0x04b24746 };
//# sourceMappingURL=index.js.map