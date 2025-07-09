import { ECPairKey } from "./ecpairkey";
import { HDKManager, PathOptions } from "./hdkmanager";
import { BNetwork } from "./types";
interface HDWalletOptions {
    network: BNetwork;
    purpose?: 44 | 84;
}
export interface HDWalletData {
    mnemonic?: string;
    wallet: HDWallet;
}
/**
 * HDWallet encapsulates an HD key manager, providing key and address derivation
 * with support for watch-only mode and automatic format detection.
 */
export declare class HDWallet {
    /** Network used for address formatting */
    readonly network: BNetwork;
    /** Whether the wallet is watch-only (xpub-based) */
    readonly isWatchOnly: boolean;
    private readonly _hdkManager;
    constructor(hdkManager: HDKManager, options?: HDWalletOptions);
    /**
     * Creates a new HDWallet with a randomly generated mnemonic.
     * @param password Optional password for the mnemonic.
     * @param options Network options.
     * @returns Object containing the mnemonic and wallet instance.
     */
    static create(passphrase?: string, options?: HDWalletOptions): HDWalletData;
    /**
     * Imports a wallet from mnemonic, xpriv, or xpub.
     * @param input String representing the mnemonic, xpriv, or xpub.
     * @param password Optional password if input is a mnemonic.
     * @param options Network options.
     * @returns Object containing the HDWallet and optionally the mnemonic.
     */
    static import(input: string, password?: string, options?: HDWalletOptions): HDWalletData;
    /**
     * Derives multiple key pairs from the wallet.
     * @param quantity Number of keys to derive.
     * @param pathOptions Optional derivation path configuration.
     * @returns Array of ECPairKey.
     */
    listPairKeys(quantity: number, pathOptions?: PathOptions): ECPairKey[];
    /**
     * Returns a list of addresses from the wallet.
     * @param quantity Number of addresses to return.
     * @param options Address type options (p2wpkh, p2pkh, etc).
     * @param pathOptions Optional derivation path configuration.
     */
    listAddresses(quantity: number, pathOptions?: PathOptions): string[];
    /**
     * Returns a list of external (receiving) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    listReceiveAddresses(quantity: number, account?: number): string[];
    /**
     * Returns a list of internal (change) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    listChangeAddresses(quantity: number, account?: number): string[];
    /**
     * Derives a single address by index.
     */
    getAddress(index: number, pathOptions?: PathOptions): string;
    /** Returns the master private key in base58 (xprv). */
    getMasterPrivateKey(): Uint8Array;
    /** Returns the master public key in base58 (xpub). */
    getMasterPublicKey(): Uint8Array;
    /** Derives the private key for a given index. */
    getPrivateKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /** Derives the public key for a given index. */
    getPublicKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /** Derives a key pair (private + public) for a given index. */
    getPairKey(index: number, pathOptions?: PathOptions): ECPairKey;
    /** Returns the extended private key (xprv). */
    getXPriv(): string;
    /** Returns the extended public key (xpub). */
    getXPub(): string;
    getWif(): string;
}
export {};
