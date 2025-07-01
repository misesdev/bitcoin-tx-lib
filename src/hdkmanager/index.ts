import { HDKey } from "@scure/bip32";
import { bytesToHex } from "../utils";
import { mnemonicToSeedSync } from "bip39";
import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";

interface HDKParams {
    purpose?: number;
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
export class HDKManager {
   
    /** BIP44 purpose field (default: 44) */
    public purpose: number; 
    /** BIP44 coin type (default: 0 for Bitcoin) */
    public coinType: number; 
    /** BIP44 account number (default: 0) */
    public account: number;
    /** BIP44 change value: 0 for external, 1 for internal (default: 0) */
    public change: number;
    /** Root HD key derived from the master seed */
    private readonly _rootKey: HDKey;
    
    /**
     * Creates a new HDKManager from a master seed.
     * @param params Object containing master seed and optional BIP44 path values.
     */
    constructor(params: HDKParams) 
    {
        this._rootKey = params.rootKey 
        this.purpose = params.purpose ?? 44
        this.coinType = params.coinType ?? 0
        this.account = params.account ?? 0
        this.change = params.change ?? 0
    }
    
    /**
     * Instantiates HDKManager from a hex-encoded master seed.
     * @param seed Hex string master seed.
     */
    public static fromMasterSeed(masterSeed: Uint8Array) : HDKManager
    {
        const rootKey = HDKey.fromMasterSeed(masterSeed)
        return new HDKManager({ rootKey }) 
    }

    /**
     * Instantiates HDKManager from a BIP39 mnemonic phrase.
     * @param mnemonic Mnemonic phrase.
     * @param password Optional BIP39 passphrase.
     */
    public static fromMnemonic(mnemonic: string, password?: string) : HDKManager
    {
        const masterSeed = mnemonicToSeedSync(mnemonic, password)
        const rootKey = HDKey.fromMasterSeed(masterSeed)
        return new HDKManager({ rootKey })
    }

    /**
     * Creates an instance from an extended private key (xpriv).
     */
    public static fromXPriv(xpriv: string, pathParams: Omit<HDKParams, 'masterSeed' | 'rootKey'> = {}): HDKManager {
        const rootKey = HDKey.fromExtendedKey(xpriv);
        if (!rootKey.privateKey) 
            throw new Error("Provided xpriv is invalid or missing private key");
        
        return new HDKManager({ ...pathParams, rootKey });
    }

    /**
     * Creates an instance from an extended public key (xpub). 
     * Only public derivation will be available.
     */
    public static fromXPub(xpub: string, pathParams: Omit<HDKParams, 'masterSeed' | 'rootKey'> = {}): HDKManager {
        const rootKey = HDKey.fromExtendedKey(xpub);
        if (rootKey.privateKey) 
            throw new Error("xpub should not contain a private key");
        return new HDKManager({ ...pathParams, rootKey });
    }

    /**
     * Derives a private key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw private key as Uint8Array.
     */
    public derivatePrivateKey(index: number, pathOptions?: PathOptions) : Uint8Array 
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        if (index < 0 || index > 2147483647) 
            throw new Error("Invalid derivation index");

        let path = this.getDerivationPath(index, pathOptions)
        let child = this._rootKey.derive(path)

        if (!child.privateKey) 
            throw new Error(`Missing private key at path ${path}`);

        return child.privateKey;
    }

    /**
     * Derives a public key from the BIP44 path ending with the given index.
     * @param index Index in the derivation path.
     * @returns Raw public key as Uint8Array.
     */
    public derivatePublicKey(index: number, pathOptions?: PathOptions) : Uint8Array 
    {
        if (index < 0 || index > 2147483647) 
            throw new Error("Invalid derivation index");

        let path = this.getDerivationPath(index, pathOptions)
        let child = this._rootKey.derive(path)

        if (!child.publicKey) 
            throw new Error(`Missing public key at path ${path}`);

        return child.publicKey;
    }

    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    public deriveMultiplePrivateKeys(quantity: number, pathOptions?: PathOptions) : Uint8Array[]
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        
        let result: Uint8Array[] = []

        for(let i = 0; i < quantity; i++)
        {
            if (i < 0 || i > 2147483647) 
                throw new Error("Invalid derivation index");
            result.push(this.derivatePrivateKey(i, pathOptions))
        }

        return result;    
    }

    /**
     * Derives multiple private keys from indexes 0 to quantity - 1.
     * @param quantity Number of keys to derive.
     */
    public deriveMultiplePublicKeys(quantity: number, pathOptions?: PathOptions) : Uint8Array[]
    {
        let result: Uint8Array[] = []

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
     * @param index Index in the derivation path.
     * @param options with network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    public derivatePairKey(index: number, options?: { network?: BNetwork }, pathOptions?: PathOptions) : ECPairKey
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        
        if (index < 0 || index > 2147483647) 
            throw new Error("Invalid derivation index");
        
        let privateKey = bytesToHex(this.derivatePrivateKey(index, pathOptions))

        return ECPairKey.fromHex(privateKey, options?.network ?? "mainnet")
    }

    /**
     * Derives multiple ECPairKeys for indexes 0 to quantity - 1.
     * @param quantity Number of pair keys to derive.
     * @param network Network: 'mainnet' or 'testnet' (default: mainnet).
     */
    public derivateMultiplePairKeys(quantity: number, options?: { network?: BNetwork }, pathOptions?: PathOptions) : ECPairKey[]
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        
        let result: ECPairKey[] = []
        for(let i = 0; i < quantity; i++)
        {
            if (i < 0 || i > 2147483647) 
                throw new Error("Invalid derivation index");
            result.push(this.derivatePairKey(i, { network: options?.network ?? "mainnet" }, pathOptions))
        }
        return result
    }

    /**
     * Returns the full BIP44 derivation path for a given index.
     * @param index Index to complete the path.
     */
    public getDerivationPath(index: number, pathOptions?: PathOptions) 
    {
        if (index < 0 || index > 2147483647) 
            throw new Error("Invalid derivation index");
      
        // In watch only (imported from xpub) derive only this path
        if(!this.hasPrivateKey())
            return `m/${pathOptions?.change ?? this.change}/${index}`

        // If have an a private key derive from hardened path
        return `
            m/${this.purpose}'
            /${this.coinType}'
            /${pathOptions?.account ?? this.account}'
            /${pathOptions?.change ?? this.change}
            /${index}`.replace(/\s+/g, "")
    }

    /**
     * Checks if the current root key has a private key.
     */
    public hasPrivateKey() 
    {
        return !!this._rootKey.privateKey
    }
    
    /**
     * Return the master private key if exists(not imported from xpub)
     */
    public getMasterPrivateKey() : Uint8Array 
    {
        if(!this._rootKey.privateKey)
            throw new Error("Missing private key")
        return this._rootKey.privateKey
    }

    /**
     * Return the master public key 
     */
    public getMasterPublicKey() : Uint8Array
    {
        if(!this._rootKey.publicKey)
            throw new Error("Missing public key")
        return this._rootKey.publicKey
    }

    public getXPriv() : string 
    {
        if(!this.hasPrivateKey())
            throw new Error("Missing private key")
        return this._rootKey.privateExtendedKey
    }

    public getXPub() : string 
    {
        return this._rootKey.publicExtendedKey
    }
}
