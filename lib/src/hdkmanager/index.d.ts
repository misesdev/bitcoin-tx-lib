import { HDKey } from "@scure/bip32";
import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";
export interface HDKParams {
    purpose?: 44 | 84;
    coinType?: number;
    account?: number;
    change?: number;
    rootKey: HDKey;
}
export interface PathOptions {
    account?: number;
    change?: number;
}
/**
 * Manages BIP44 HD keys derivation from a master seed or mnemonic.
 */
export declare class HDKManager {
    /** BIP44 purpose field (default: 44) */
    purpose: 44 | 84;
    /** BIP44 coin type (default: 0 for Bitcoin) */
    coinType: number;
    /** BIP44 account number (default: 0) */
    account: number;
    /** BIP44 change value: 0 for external, 1 for internal (default: 0) */
    change: number;
    /** Root HD key derived from the master seed */
    private readonly _rootKey;
    private static readonly bip44Versions;
    private static readonly bip84Versions;
    /**
     * Creates a new HDKManager from a master seed.
     * @param params Object containing master seed and optional BIP44 path values.
     */
    constructor(params: HDKParams);
    /**
     * Instantiates HDKManager from a hex-encoded master seed.
     * @param seed Hex string master seed.
     */
    static fromMasterSeed(masterSeed: Uint8Array, options?: HDKParams): HDKManager;
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     * @param mnemonic Mnemonic phrase.
     * @param password Optional BIP39 passphrase.
     */
    static fromMnemonic(mnemonic: string, passphrase?: string, options?: HDKParams): HDKManager;
    /**
     * Creates an instance from an extended private key (xpriv).
     */
    static fromXPriv(xpriv: string, pathParams?: Omit<HDKParams, 'masterSeed' | 'rootKey'>): HDKManager;
    /**
     * Creates an instance from an extended public key (xpub).
     * Only public derivation will be available.
     */
    static fromXPub(xpub: string, pathParams?: Omit<HDKParams, 'masterSeed' | 'rootKey'>): HDKManager;
    /**
     * Derives a private key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw private key as Uint8Array.
     */
    derivatePrivateKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /**
     * Derives a public key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw public key as Uint8Array.
     */
    derivatePublicKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePrivateKeys(quantity: number, pathOptions?: PathOptions): Uint8Array[];
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePublicKeys(quantity: number, pathOptions?: PathOptions): Uint8Array[];
    /**
     * Derives an ECPairKey from a private key at a specific index.
     * @param index Index in the derivation path.
     * @param options with network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivatePairKey(index: number, options?: {
        network?: BNetwork;
    }, pathOptions?: PathOptions): ECPairKey;
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     * @param quantity Number of pair keys to derive.
     * @param network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivateMultiplePairKeys(quantity: number, options?: {
        network?: BNetwork;
    }, pathOptions?: PathOptions): ECPairKey[];
    /**
     * Returns the full BIP44 derivation path for a given index.
     * @param index Index to complete the path.
     */
    getDerivationPath(index: number, pathOptions?: PathOptions): string;
    /**
     * Checks if the current root key has a private key.
     */
    hasPrivateKey(): boolean;
    /**
     * Return the master private key if exists(not imported from xpub)
     */
    getMasterPrivateKey(): Uint8Array;
    /**
     * Return the master public key
     */
    getMasterPublicKey(): Uint8Array;
    getXPriv(): string;
    getXPub(): string;
    private static getVersion;
}
