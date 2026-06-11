import { HDKey } from "@scure/bip32";
import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";
export interface HDKParams {
    purpose?: 44 | 84;
    coinType?: number;
    account?: number;
    change?: number;
    rootKey: HDKey;
    network?: BNetwork;
}
export interface PathOptions {
    account?: number;
    change?: number;
}
/**
 * Manages BIP44/84 HD key derivation from a master seed, mnemonic, or extended key.
 * Supports mainnet (xprv/xpub, zprv/zpub) and testnet (tprv/tpub, vprv/vpub) key formats.
 */
export declare class HDKManager {
    /** BIP44/84 purpose field (default: 84) */
    purpose: 44 | 84;
    /** BIP44 coin type (default: 0 for Bitcoin) */
    coinType: number;
    /** BIP44 account number (default: 0) */
    account: number;
    /** BIP44 change value: 0 for external, 1 for internal (default: 0) */
    change: number;
    /** Network this manager is associated with */
    readonly network: BNetwork;
    /** Root HD key derived from the master seed */
    private readonly _rootKey;
    private static readonly versions;
    constructor(params: HDKParams);
    /**
     * Instantiates HDKManager from a raw master seed.
     */
    static fromMasterSeed(masterSeed: Uint8Array, options?: HDKParams): HDKManager;
    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     */
    static fromMnemonic(mnemonic: string, passphrase?: string, options?: HDKParams): HDKManager;
    /**
     * Creates an instance from an extended private key.
     * Accepts xprv (BIP44 mainnet), tprv (BIP44 testnet), zprv (BIP84 mainnet), vprv (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    static fromXPriv(xpriv: string, pathParams?: Omit<HDKParams, 'rootKey'>): HDKManager;
    /**
     * Creates an instance from an extended public key (watch-only).
     * Accepts xpub (BIP44 mainnet), tpub (BIP44 testnet), zpub (BIP84 mainnet), vpub (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    static fromXPub(xpub: string, pathParams?: Omit<HDKParams, 'rootKey'>): HDKManager;
    /**
     * Derives a private key from the BIP44/84 path at the given index.
     */
    derivatePrivateKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /**
     * Derives a public key from the BIP44/84 path at the given index.
     */
    derivatePublicKey(index: number, pathOptions?: PathOptions): Uint8Array;
    /**
     * Derives multiple private keys for indexes 0 to quantity - 1.
     */
    deriveMultiplePrivateKeys(quantity: number, pathOptions?: PathOptions): Uint8Array[];
    /**
     * Derives multiple public keys for indexes 0 to quantity - 1.
     */
    deriveMultiplePublicKeys(quantity: number, pathOptions?: PathOptions): Uint8Array[];
    /**
     * Derives an ECPairKey from a private key at a specific index.
     */
    derivatePairKey(index: number, options?: {
        network?: BNetwork;
    }, pathOptions?: PathOptions): ECPairKey;
    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     */
    derivateMultiplePairKeys(quantity: number, options?: {
        network?: BNetwork;
    }, pathOptions?: PathOptions): ECPairKey[];
    /**
     * Returns the full BIP44/84 derivation path for a given index.
     */
    getDerivationPath(index: number, pathOptions?: PathOptions): string;
    /**
     * Checks if the current root key has a private key.
     */
    hasPrivateKey(): boolean;
    getMasterPrivateKey(): Uint8Array;
    getMasterPublicKey(): Uint8Array;
    /**
     * Returns the extended private key serialized with the correct version bytes.
     * Mainnet BIP44 → xprv, Testnet BIP44 → tprv, Mainnet BIP84 → zprv, Testnet BIP84 → vprv.
     */
    getXPriv(): string;
    /**
     * Returns the extended public key serialized with the correct version bytes.
     * Mainnet BIP44 → xpub, Testnet BIP44 → tpub, Mainnet BIP84 → zpub, Testnet BIP84 → vpub.
     */
    getXPub(): string;
    /**
     * Resolves the correct HD key version bytes for the given purpose and network.
     */
    private static resolveVersions;
    /**
     * Detects purpose, network, and version bytes from an extended key prefix.
     * Supports: xprv/xpub (BIP44 mainnet), tprv/tpub (BIP44 testnet),
     *           zprv/zpub (BIP84 mainnet), vprv/vpub (BIP84 testnet).
     */
    private static detectExtendedKeyInfo;
}
