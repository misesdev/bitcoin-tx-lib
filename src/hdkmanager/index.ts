import { HDKey } from "@scure/bip32";
import { bytesToHex } from "../utils";
import { mnemonicToSeedSync } from "@scure/bip39"
import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";

type Versions = { private: number; public: number };

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
export class HDKManager {

    /** BIP44/84 purpose field (default: 84) */
    public purpose: 44 | 84;
    /** BIP44 coin type (default: 0 for Bitcoin) */
    public coinType: number;
    /** BIP44 account number (default: 0) */
    public account: number;
    /** BIP44 change value: 0 for external, 1 for internal (default: 0) */
    public change: number;
    /** Network this manager is associated with */
    public readonly network: BNetwork;
    /** Root HD key derived from the master seed */
    private readonly _rootKey: HDKey;

    private static readonly versions = {
        bip44Mainnet: { private: 0x0488ade4, public: 0x0488b21e } as Versions,
        bip44Testnet: { private: 0x04358394, public: 0x043587cf } as Versions,
        bip84Mainnet: { private: 0x04b2430c, public: 0x04b24746 } as Versions,
        bip84Testnet: { private: 0x045f18bc, public: 0x045f1cf6 } as Versions,
    };

    constructor(params: HDKParams)
    {
        this._rootKey = params.rootKey
        this.purpose = params.purpose ?? 84
        this.coinType = params.coinType ?? 0
        this.account = params.account ?? 0
        this.change = params.change ?? 0
        this.network = params.network ?? "mainnet"
    }

    /**
     * Instantiates HDKManager from a raw master seed.
     */
    public static fromMasterSeed(masterSeed: Uint8Array, options?: HDKParams) : HDKManager
    {
        const versions = this.resolveVersions(options?.purpose, options?.network)
        const rootKey = HDKey.fromMasterSeed(masterSeed, versions)
        return new HDKManager({ ...options, rootKey })
    }

    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     */
    public static fromMnemonic(mnemonic: string, passphrase?: string, options?: HDKParams) : HDKManager
    {
        const masterSeed = mnemonicToSeedSync(mnemonic, passphrase)
        const versions = this.resolveVersions(options?.purpose, options?.network)
        const rootKey = HDKey.fromMasterSeed(masterSeed, versions)
        return new HDKManager({ ...options, rootKey })
    }

    /**
     * Creates an instance from an extended private key.
     * Accepts xprv (BIP44 mainnet), tprv (BIP44 testnet), zprv (BIP84 mainnet), vprv (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    public static fromXPriv(xpriv: string, pathParams: Omit<HDKParams, 'rootKey'> = {}): HDKManager {
        const info = this.detectExtendedKeyInfo(xpriv)
        const rootKey = HDKey.fromExtendedKey(xpriv, info.versions)
        if (!rootKey.privateKey)
            throw new Error("Provided xpriv is invalid or missing private key")

        return new HDKManager({ purpose: info.purpose, network: info.network, ...pathParams, rootKey })
    }

    /**
     * Creates an instance from an extended public key (watch-only).
     * Accepts xpub (BIP44 mainnet), tpub (BIP44 testnet), zpub (BIP84 mainnet), vpub (BIP84 testnet).
     * Purpose and network are inferred from the key prefix; pathParams may override them.
     */
    public static fromXPub(xpub: string, pathParams: Omit<HDKParams, 'rootKey'> = {}): HDKManager {
        const info = this.detectExtendedKeyInfo(xpub)
        const rootKey = HDKey.fromExtendedKey(xpub, info.versions)
        if (rootKey.privateKey)
            throw new Error("xpub should not contain a private key")

        return new HDKManager({ purpose: info.purpose, network: info.network, ...pathParams, rootKey })
    }

    /**
     * Derives a private key from the BIP44/84 path at the given index.
     */
    public derivatePrivateKey(index: number, pathOptions?: PathOptions) : Uint8Array
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");

        const path = this.getDerivationPath(index, pathOptions)
        const child = this._rootKey.derive(path)

        if (!child.privateKey)
            throw new Error(`Missing private key at path ${path}`);

        return child.privateKey;
    }

    /**
     * Derives a public key from the BIP44/84 path at the given index.
     */
    public derivatePublicKey(index: number, pathOptions?: PathOptions) : Uint8Array
    {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");

        const path = this.getDerivationPath(index, pathOptions)
        const child = this._rootKey.derive(path)

        if (!child.publicKey)
            throw new Error(`Missing public key at path ${path}`);

        return child.publicKey;
    }

    /**
     * Derives multiple private keys for indexes 0 to quantity - 1.
     */
    public deriveMultiplePrivateKeys(quantity: number, pathOptions?: PathOptions) : Uint8Array[]
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")

        const result: Uint8Array[] = []

        for(let i = 0; i < quantity; i++)
        {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePrivateKey(i, pathOptions))
        }

        return result;
    }

    /**
     * Derives multiple public keys for indexes 0 to quantity - 1.
     */
    public deriveMultiplePublicKeys(quantity: number, pathOptions?: PathOptions) : Uint8Array[]
    {
        const result: Uint8Array[] = []

        for(let i = 0; i < quantity; i++)
        {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePublicKey(i, pathOptions))
        }

        return result;
    }

    /**
     * Derives an ECPairKey from a private key at a specific index.
     */
    public derivatePairKey(index: number, options?: { network?: BNetwork }, pathOptions?: PathOptions) : ECPairKey
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")

        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");

        const privateKey = bytesToHex(this.derivatePrivateKey(index, pathOptions))

        return ECPairKey.fromHex(privateKey, options?.network ?? this.network)
    }

    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     */
    public derivateMultiplePairKeys(quantity: number, options?: { network?: BNetwork }, pathOptions?: PathOptions) : ECPairKey[]
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")

        const result: ECPairKey[] = []
        for(let i = 0; i < quantity; i++)
        {
            if (i < 0 || i > 2147483647)
                throw new Error("Invalid derivation index");
            result.push(this.derivatePairKey(i, { network: options?.network ?? this.network }, pathOptions))
        }
        return result
    }

    /**
     * Returns the full BIP44/84 derivation path for a given index.
     */
    public getDerivationPath(index: number, pathOptions?: PathOptions)
    {
        if (index < 0 || index > 2147483647)
            throw new Error("Invalid derivation index");

        // Watch-only (imported from xpub/zpub/etc.): derive only relative path
        if(!this.hasPrivateKey())
            return `m/${pathOptions?.change ?? this.change}/${index}`

        return `m/${this.purpose}'/${this.coinType}'/${pathOptions?.account ?? this.account}'/${pathOptions?.change ?? this.change}/${index}`
    }

    /**
     * Checks if the current root key has a private key.
     */
    public hasPrivateKey()
    {
        return !!this._rootKey.privateKey
    }

    public getMasterPrivateKey() : Uint8Array
    {
        if(!this._rootKey.privateKey)
            throw new Error("Missing private key")
        return this._rootKey.privateKey
    }

    public getMasterPublicKey() : Uint8Array
    {
        if(!this._rootKey.publicKey)
            throw new Error("Missing public key")
        return this._rootKey.publicKey
    }

    /**
     * Returns the extended private key serialized with the correct version bytes.
     * Mainnet BIP44 → xprv, Testnet BIP44 → tprv, Mainnet BIP84 → zprv, Testnet BIP84 → vprv.
     */
    public getXPriv() : string
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        return this._rootKey.privateExtendedKey
    }

    /**
     * Returns the extended public key serialized with the correct version bytes.
     * Mainnet BIP44 → xpub, Testnet BIP44 → tpub, Mainnet BIP84 → zpub, Testnet BIP84 → vpub.
     */
    public getXPub() : string
    {
        return this._rootKey.publicExtendedKey
    }

    /**
     * Resolves the correct HD key version bytes for the given purpose and network.
     */
    private static resolveVersions(purpose?: number, network?: BNetwork): Versions {
        const isTestnet = network === "testnet"
        if (purpose === 44) {
            return isTestnet ? this.versions.bip44Testnet : this.versions.bip44Mainnet
        }
        return isTestnet ? this.versions.bip84Testnet : this.versions.bip84Mainnet
    }

    /**
     * Detects purpose, network, and version bytes from an extended key prefix.
     * Supports: xprv/xpub (BIP44 mainnet), tprv/tpub (BIP44 testnet),
     *           zprv/zpub (BIP84 mainnet), vprv/vpub (BIP84 testnet).
     */
    private static detectExtendedKeyInfo(key: string): { versions: Versions; purpose: 44 | 84; network: BNetwork } {
        const prefix = key.slice(0, 4)
        switch (prefix) {
            case "xprv": case "xpub": return { versions: this.versions.bip44Mainnet, purpose: 44, network: "mainnet" }
            case "tprv": case "tpub": return { versions: this.versions.bip44Testnet, purpose: 44, network: "testnet" }
            case "zprv": case "zpub": return { versions: this.versions.bip84Mainnet, purpose: 84, network: "mainnet" }
            case "vprv": case "vpub": return { versions: this.versions.bip84Testnet, purpose: 84, network: "testnet" }
            default: throw new Error(`Unrecognized extended key prefix: "${prefix}". Supported: xprv/xpub, tprv/tpub, zprv/zpub, vprv/vpub`)
        }
    }
}
