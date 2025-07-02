"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDWallet = void 0;
const ecpairkey_1 = require("./ecpairkey");
const hdkmanager_1 = require("./hdkmanager");
const bip39_1 = require("bip39");
const address_1 = require("./utils/address");
const utils_1 = require("./utils");
const defaultTypeAddress = "p2wpkh";
/**
 * HDWallet encapsulates an HD key manager, providing key and address derivation
 * with support for watch-only mode and automatic format detection.
 */
class HDWallet {
    constructor(hdkManager, options) {
        var _a;
        this._hdkManager = hdkManager;
        this.isWatchOnly = !hdkManager.hasPrivateKey();
        this.network = (_a = options === null || options === void 0 ? void 0 : options.network) !== null && _a !== void 0 ? _a : "mainnet";
    }
    /**
     * Creates a new HDWallet with a randomly generated mnemonic.
     * @param password Optional password for the mnemonic.
     * @param options Network options.
     * @returns Object containing the mnemonic and wallet instance.
     */
    static create(password, options) {
        const mnemonic = (0, bip39_1.generateMnemonic)(128);
        const hdwallet = new HDWallet(hdkmanager_1.HDKManager.fromMnemonic(mnemonic, password), options);
        return { mnemonic, hdwallet };
    }
    /**
     * Imports a wallet from mnemonic, xpriv, or xpub.
     * @param input String representing the mnemonic, xpriv, or xpub.
     * @param password Optional password if input is a mnemonic.
     * @param options Network options.
     * @returns Object containing the HDWallet and optionally the mnemonic.
     */
    static import(input, password, options) {
        const trimmed = input.trim();
        if (trimmed.split(/\s+/).length > 1) {
            if (!(0, bip39_1.validateMnemonic)(trimmed))
                throw new Error("Invalid seed phrase (mnemonic)");
            const hdwallet = new HDWallet(hdkmanager_1.HDKManager.fromMnemonic(trimmed, password), options);
            return { mnemonic: trimmed, hdwallet };
        }
        if (/^(xprv|tprv)[a-zA-Z0-9]+$/.test(trimmed)) {
            const hdwallet = new HDWallet(hdkmanager_1.HDKManager.fromXPriv(trimmed), options);
            return { hdwallet };
        }
        if (/^(xpub|tpub)[a-zA-Z0-9]+$/.test(trimmed)) {
            const hdwallet = new HDWallet(hdkmanager_1.HDKManager.fromXPub(trimmed), options);
            return { hdwallet };
        }
        throw new Error("Unsupported or invalid HD wallet data format, expected mnemonic, xpriv or xpub.");
    }
    /**
     * Derives multiple key pairs from the wallet.
     * @param quantity Number of keys to derive.
     * @param pathOptions Optional derivation path configuration.
     * @returns Array of ECPairKey.
     */
    listPairKeys(quantity, pathOptions) {
        if (this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only");
        return this._hdkManager.derivateMultiplePairKeys(quantity, {
            network: this.network
        }, pathOptions);
    }
    /**
     * Returns a list of addresses from the wallet.
     * @param quantity Number of addresses to return.
     * @param options Address type options (p2wpkh, p2pkh, etc).
     * @param pathOptions Optional derivation path configuration.
     */
    listAddresses(quantity, type, pathOptions) {
        if (this.isWatchOnly) {
            return this._hdkManager.deriveMultiplePublicKeys(quantity, pathOptions)
                .map(pubkey => address_1.Address.fromPubkey({
                pubkey: (0, utils_1.bytesToHex)(pubkey),
                type: type !== null && type !== void 0 ? type : defaultTypeAddress
            }));
        }
        return this._hdkManager.derivateMultiplePairKeys(quantity, {
            network: this.network
        }, pathOptions)
            .map(pair => pair.getAddress(type));
    }
    /**
     * Returns a list of external (receiving) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    listReceiveAddresses(quantity, type, account = 0) {
        return this.listAddresses(quantity, type, { account, change: 0 });
    }
    /**
     * Returns a list of internal (change) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    listChangeAddresses(quantity, type, account = 0) {
        return this.listAddresses(quantity, type, { account, change: 1 });
    }
    /**
     * Derives a single address by index.
     */
    getAddress(index, type, pathOptions) {
        if (this.isWatchOnly) {
            const pubkey = this._hdkManager.derivatePublicKey(index, pathOptions);
            return address_1.Address.fromPubkey({
                pubkey: (0, utils_1.bytesToHex)(pubkey),
                type: type !== null && type !== void 0 ? type : defaultTypeAddress,
                network: this.network,
            });
        }
        return this.getPairKey(index, pathOptions)
            .getAddress(type !== null && type !== void 0 ? type : defaultTypeAddress);
    }
    /** Returns the master private key in base58 (xprv). */
    getMasterPrivateKey() {
        if (this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only");
        return this._hdkManager.getMasterPrivateKey();
    }
    /** Returns the master public key in base58 (xpub). */
    getMasterPublicKey() {
        return this._hdkManager.getMasterPublicKey();
    }
    /** Derives the private key for a given index. */
    getPrivateKey(index, pathOptions) {
        if (this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only");
        return this._hdkManager.derivatePrivateKey(index, pathOptions);
    }
    /** Derives the public key for a given index. */
    getPublicKey(index, pathOptions) {
        return this._hdkManager.derivatePublicKey(index, pathOptions);
    }
    /** Derives a key pair (private + public) for a given index. */
    getPairKey(index, pathOptions) {
        if (this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only");
        return this._hdkManager.derivatePairKey(index, {
            network: this.network
        }, pathOptions);
    }
    /** Returns the extended private key (xprv). */
    getXPriv() {
        if (this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only");
        return this._hdkManager.getXPriv();
    }
    /** Returns the extended public key (xpub). */
    getXPub() {
        return this._hdkManager.getXPub();
    }
    getWif() {
        const pairkey = ecpairkey_1.ECPairKey.fromHex((0, utils_1.bytesToHex)(this.getMasterPrivateKey()), this.network);
        return pairkey.getWif();
    }
}
exports.HDWallet = HDWallet;
//# sourceMappingURL=hdwallet.js.map