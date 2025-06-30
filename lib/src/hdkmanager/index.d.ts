import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";
interface HDKParams {
    purpose?: number;
    coinType?: number;
    account?: number;
    change?: number;
    masterSeed: Uint8Array;
}
/**
 * Manages BIP44 HD wallet derivation from a master seed or mnemonic.
 */
export declare class HDKManager {
    /** BIP44 purpose field (default: 44) */
    purpose: number;
    /** BIP44 coin type (default: 0 for Bitcoin) */
    coinType: number;
    /** BIP44 account number (default: 0) */
    account: number;
    /** BIP44 change value: 0 for external, 1 for internal (default: 0) */
    change: number;
    /** Root HD key derived from the master seed */
    private readonly root;
    /**
     * Creates a new HDKManager from a master seed.
     * @param params Object containing master seed and optional BIP44 path values.
     */
    constructor(params: HDKParams);
    /**
     * Instantiates HDKManager from a hex-encoded master seed.
     * @param seed Hex string master seed.
     */
    static fromMasterSeed(seed: string): HDKManager;
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     * @param mnemonic Mnemonic phrase.
     * @param password Optional BIP39 passphrase.
     */
    static fromMnemonic(mnemonic: string, password?: string): HDKManager;
    /**
     * Derives a private key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw private key as Uint8Array.
     */
    derivatePrivateKey(index: number): Uint8Array;
    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    deriveMultiplePrivateKeys(quantity: number): Uint8Array[];
    /**
     * Derives an ECPairKey from a private key at a specific index.
     * @param index Index in the derivation path.
     * @param options with network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivatePairKey(index: number, options?: {
        network?: BNetwork;
    }): ECPairKey;
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     * @param quantity Number of pair keys to derive.
     * @param network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    derivateMultiplePairKeys(quantity: number, options?: {
        network?: BNetwork;
    }): ECPairKey[];
    /**
     * Returns the full BIP44 derivation path for a given index.
     * @param index Index to complete the path.
     */
    getDerivationPath(index: number): string;
}
export {};
