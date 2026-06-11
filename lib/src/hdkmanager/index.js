"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDKManager = void 0;
const bip32_1 = require("@scure/bip32");
const utils_1 = require("../utils");
const bip39_1 = require("@scure/bip39");
const ecpairkey_1 = require("../ecpairkey");
/**
 * Manages BIP44/84 HD key derivation from a master seed, mnemonic, or extended key.
 * Supports mainnet (xprv/xpub, zprv/zpub) and testnet (tprv/tpub, vprv/vpub) key formats.
 */
class HDKManager {
    constructor(params) {
        var _a, _b, _c, _d, _e;
        this._rootKey = params.rootKey;
        this.purpose = (_a = params.purpose) !== null && _a !== void 0 ? _a : 84;
        this.coinType = (_b = params.coinType) !== null && _b !== void 0 ? _b : 0;
        this.account = (_c = params.account) !== null && _c !== void 0 ? _c : 0;
        this.change = (_d = params.change) !== null && _d !== void 0 ? _d : 0;
        this.network = (_e = params.network) !== null && _e !== void 0 ? _e : "mainnet";
    }
    /**
     * Instantiates HDKManager from a raw master seed.
     */
    static fromMasterSeed(masterSeed, options) {
        const versions = this.resolveVersions(options === null || options === void 0 ? void 0 : options.purpose, options === null || options === void 0 ? void 0 : options.network);
        const rootKey = bip32_1.HDKey.fromMasterSeed(masterSeed, versions);
        return new HDKManager(Object.assign(Object.assign({}, options), { rootKey }));
    }
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     */
    static fromMnemonic(mnemonic, passphrase, options) {
        const masterSeed = (0, bip39_1.mnemonicToSeedSync)(mnemonic, passphrase);
        const versions = this.resolveVersions(options === null || options === void 0 ? void 0 : options.purpose, options === null || options === void 0 ? void 0 : options.network);
        const rootKey = bip32_1.HDKey.fromMasterSeed(masterSeed, versions);
        return new HDKManager(Object.assign(Object.assign({}, options), { rootKey }));
    }
    /**
     * Creates an instance from an extended private key.
     * Accepts xprv (BIP44 mainnet), tprv (BIP44 testnet), zprv (BIP84 mainnet), vprv (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    static fromXPriv(xpriv, pathParams = {}) {
        const info = this.detectExtendedKeyInfo(xpriv);
        const rootKey = bip32_1.HDKey.fromExtendedKey(xpriv, info.versions);
        if (!rootKey.privateKey)
            throw new Error("Provided xpriv is invalid or missing private key");
        return new HDKManager(Object.assign(Object.assign({ purpose: info.purpose, network: info.network }, pathParams), { rootKey }));
    }
    /**
     * Creates an instance from an extended public key (watch-only).
     * Accepts xpub (BIP44 mainnet), tpub (BIP44 testnet), zpub (BIP84 mainnet), vpub (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    static fromXPub(xpub, pathParams = {}) {
        const info = this.detectExtendedKeyInfo(xpub);
        const rootKey = bip32_1.HDKey.fromExtendedKey(xpub, info.versions);
        if (rootKey.privateKey)
            throw new Error("xpub should not contain a private key");
        return new HDKManager(Object.assign(Object.assign({ purpose: info.purpose, network: info.network }, pathParams), { rootKey }));
    }
    /**
     * Derives a private key from the BIP44/84 path at the given index.
     */
    derivatePrivateKey(index, pathOptions) {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        const path = this.getDerivationPath(index, pathOptions);
        const child = this._rootKey.derive(path);
        if (!child.privateKey)
            throw new Error(`Missing private key at path ${path}`);
        return child.privateKey;
    }
    /**
     * Derives a public key from the BIP44/84 path at the given index.
     */
    derivatePublicKey(index, pathOptions) {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        const path = this.getDerivationPath(index, pathOptions);
        const child = this._rootKey.derive(path);
        if (!child.publicKey)
            throw new Error(`Missing public key at path ${path}`);
        return child.publicKey;
    }
    /**
     * Derives multiple private keys for indexes 0 to quantity - 1.
     */
    deriveMultiplePrivateKeys(quantity, pathOptions) {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        const result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePrivateKey(i, pathOptions));
        }
        return result;
    }
    /**
     * Derives multiple public keys for indexes 0 to quantity - 1.
     */
    deriveMultiplePublicKeys(quantity, pathOptions) {
        const result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePublicKey(i, pathOptions));
        }
        return result;
    }
    /**
     * Derives an ECPairKey from a private key at a specific index.
     */
    derivatePairKey(index, options, pathOptions) {
        var _a;
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        const privateKey = (0, utils_1.bytesToHex)(this.derivatePrivateKey(index, pathOptions));
        const type = this.purpose === 84 ? "p2wpkh" : "p2pkh";
        return new ecpairkey_1.ECPairKey({ privateKey: (0, utils_1.hexToBytes)(privateKey), network: (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : this.network, type });
    }
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     */
    derivateMultiplePairKeys(quantity, options, pathOptions) {
        var _a;
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        const result = [];
        for (let i = 0; i < quantity; i++) {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePairKey(i, { network: (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : this.network }, pathOptions));
        }
        return result;
    }
    /**
     * Returns the full BIP44/84 derivation path for a given index.
     */
    getDerivationPath(index, pathOptions) {
        var _a, _b, _c;
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");
        // Watch-only (imported from xpub/zpub/etc.): derive only relative path
        if (!this.hasPrivateKey())
            return `m/${(_a = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.change) !== null && _a !== void 0 ? _a : this.change}/${index}`;
        return `m/${this.purpose}'/${this.coinType}'/${(_b = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.account) !== null && _b !== void 0 ? _b : this.account}'/${(_c = pathOptions === null || pathOptions === void 0 ? void 0 : pathOptions.change) !== null && _c !== void 0 ? _c : this.change}/${index}`;
    }
    /**
     * Checks if the current root key has a private key.
     */
    hasPrivateKey() {
        return !!this._rootKey.privateKey;
    }
    getMasterPrivateKey() {
        if (!this._rootKey.privateKey)
            throw new Error("Missing private key");
        return this._rootKey.privateKey;
    }
    getMasterPublicKey() {
        if (!this._rootKey.publicKey)
            throw new Error("Missing public key");
        return this._rootKey.publicKey;
    }
    /**
     * Returns the extended private key serialized with the correct version bytes.
     * Mainnet BIP44 → xprv, Testnet BIP44 → tprv, Mainnet BIP84 → zprv, Testnet BIP84 → vprv.
     */
    getXPriv() {
        if (!this.hasPrivateKey())
            throw new Error("Missing private key");
        return this._rootKey.privateExtendedKey;
    }
    /**
     * Returns the extended public key serialized with the correct version bytes.
     * Mainnet BIP44 → xpub, Testnet BIP44 → tpub, Mainnet BIP84 → zpub, Testnet BIP84 → vpub.
     */
    getXPub() {
        return this._rootKey.publicExtendedKey;
    }
    /**
     * Resolves the correct HD key version bytes for the given purpose and network.
     */
    static resolveVersions(purpose, network) {
        const isTestnet = network === "testnet";
        if (purpose === 44) {
            return isTestnet ? this.versions.bip44Testnet : this.versions.bip44Mainnet;
        }
        return isTestnet ? this.versions.bip84Testnet : this.versions.bip84Mainnet;
    }
    /**
     * Detects purpose, network, and version bytes from an extended key prefix.
     * Supports: xprv/xpub (BIP44 mainnet), tprv/tpub (BIP44 testnet),
     *           zprv/zpub (BIP84 mainnet), vprv/vpub (BIP84 testnet).
     */
    static detectExtendedKeyInfo(key) {
        const prefix = key.slice(0, 4);
        switch (prefix) {
            case "xprv":
            case "xpub": return { versions: this.versions.bip44Mainnet, purpose: 44, network: "mainnet" };
            case "tprv":
            case "tpub": return { versions: this.versions.bip44Testnet, purpose: 44, network: "testnet" };
            case "zprv":
            case "zpub": return { versions: this.versions.bip84Mainnet, purpose: 84, network: "mainnet" };
            case "vprv":
            case "vpub": return { versions: this.versions.bip84Testnet, purpose: 84, network: "testnet" };
            default: throw new Error(`Unrecognized extended key prefix: "${prefix}". Supported: xprv/xpub, tprv/tpub, zprv/zpub, vprv/vpub`);
        }
    }
}
exports.HDKManager = HDKManager;
HDKManager.versions = {
    bip44Mainnet: { private: 0x0488ade4, public: 0x0488b21e },
    bip44Testnet: { private: 0x04358394, public: 0x043587cf },
    bip84Mainnet: { private: 0x04b2430c, public: 0x04b24746 },
    bip84Testnet: { private: 0x045f18bc, public: 0x045f1cf6 },
};
//# sourceMappingURL=index.js.map