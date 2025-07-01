import { ECPairKey } from "../ecpairkey";
import { HDKManager, PathOptions } from "../hdkmanager";
import {  generateMnemonic, validateMnemonic } from "bip39"
import { BNetwork, TypeAddress } from "../types";
import { Address } from "../utils/address";
import { bytesToHex } from "../utils";

const defaultTypeAddress: TypeAddress = "p2wpkh"

interface HDWalletOptions {
    network: BNetwork
}

export interface IHDWallet {
    mnemonic?: string;
    hdwallet: HDWallet;
}

/**
 * HDWallet encapsulates an HD key manager, providing key and address derivation
 * with support for watch-only mode and automatic format detection.
 */
export class HDWallet 
{
    /** Network used for address formatting */
    public readonly network: BNetwork;
    /** Whether the wallet is watch-only (xpub-based) */
    public readonly isWatchOnly: boolean;
    private readonly _hdkManager: HDKManager;

    constructor(hdkManager: HDKManager, options?: HDWalletOptions) 
    {
        this._hdkManager = hdkManager
        this.isWatchOnly = !hdkManager.hasPrivateKey()
        this.network = options?.network ?? "mainnet"
    }

    /**
     * Creates a new HDWallet with a randomly generated mnemonic.
     * @param password Optional password for the mnemonic.
     * @param options Network options.
     * @returns Object containing the mnemonic and wallet instance.
     */
    public static create(password?: string, options?: HDWalletOptions) : IHDWallet
    {
        const mnemonic = generateMnemonic(128)
        const hdwallet = new HDWallet(HDKManager.fromMnemonic(mnemonic, password), options)
        return { mnemonic, hdwallet }
    }

    /**
     * Imports a wallet from mnemonic, xpriv, or xpub.
     * @param input String representing the mnemonic, xpriv, or xpub.
     * @param password Optional password if input is a mnemonic.
     * @param options Network options.
     * @returns Object containing the HDWallet and optionally the mnemonic.
     */
    public static import(input: string, password?: string, options?: HDWalletOptions) : IHDWallet
    {
        const trimmed = input.trim()

        if(trimmed.split(/\s+/).length > 1) 
        {
            if(!validateMnemonic(trimmed))
                throw new Error("Invalid seed phrase (mnemonic)")

            const hdwallet = new HDWallet(HDKManager.fromMnemonic(trimmed, password), options)
            return { mnemonic: trimmed, hdwallet }
        }

        if (/^(xprv|tprv)[a-zA-Z0-9]+$/.test(trimmed)) {
            const hdwallet = new HDWallet(HDKManager.fromXPriv(trimmed), options)
            return { hdwallet }
        }

        if (/^(xpub|tpub)[a-zA-Z0-9]+$/.test(trimmed)) {
            const hdwallet = new HDWallet(HDKManager.fromXPub(trimmed), options)
            return { hdwallet }
        }

        throw new Error("Unsupported or invalid HD wallet data format, expected mnemonic, xpriv or xpub.");
    }

    /**
     * Derives multiple key pairs from the wallet.
     * @param quantity Number of keys to derive.
     * @param pathOptions Optional derivation path configuration.
     * @returns Array of ECPairKey.
     */
    public listPairKeys(quantity: number, pathOptions?: PathOptions) : ECPairKey[]
    {
        if(this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only")
        return this._hdkManager.derivateMultiplePairKeys(quantity, {
            network: this.network
        }, pathOptions) 
    }
    
    /**
     * Returns a list of addresses from the wallet.
     * @param quantity Number of addresses to return.
     * @param options Address type options (p2wpkh, p2pkh, etc).
     * @param pathOptions Optional derivation path configuration.
     */
    public listAddresses(quantity: number, type: TypeAddress, pathOptions?: PathOptions) : string[]
    {
        if(this.isWatchOnly) {
            return this._hdkManager.deriveMultiplePublicKeys(quantity, pathOptions)
                .map(pubkey => Address.fromPubkey({
                    pubkey: bytesToHex(pubkey),
                    type: type ?? defaultTypeAddress
                }))
        }

        return this._hdkManager.derivateMultiplePairKeys(quantity, {
                network: this.network 
            }, pathOptions)
            .map(pair => pair.getAddress(type))
    }

    /**
     * Returns a list of external (receiving) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    public listReceiveAddresses(quantity: number, type: TypeAddress, account: number = 0) 
    {
        return this.listAddresses(quantity, type, { account, change: 0 })
    }

    /**
     * Returns a list of internal (change) addresses as per BIP44.
     * @param quantity Number of addresses to return.
     * @param type Address type options (p2wpkh, p2pkh, etc).
     * @param account Account index (default is 0).
     */
    public listChangeAddresses(quantity: number, type: TypeAddress, account: number = 0) 
    {
        return this.listAddresses(quantity, type, { account, change: 1 })
    }

    /**
     * Derives a single address by index.
     */
    public getAddress(index: number, type: TypeAddress, pathOptions?: PathOptions) : string
    {
        if(this.isWatchOnly) 
        {
            const pubkey = this._hdkManager.derivatePublicKey(index, pathOptions)
            return Address.fromPubkey({ 
                pubkey: bytesToHex(pubkey),
                type: type ?? defaultTypeAddress,
                network: this.network,
            })
        }

        return this.getPairKey(index, pathOptions)
            .getAddress(type ?? defaultTypeAddress)
    }

    /** Returns the master private key in base58 (xprv). */
    public getMasterPrivateKey() : Uint8Array
    {
        if(this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only")
        return this._hdkManager.getMasterPrivateKey()
    }
    
    /** Returns the master public key in base58 (xpub). */
    public getMasterPublicKey() : Uint8Array
    {
        return this._hdkManager.getMasterPublicKey()
    }

    /** Derives the private key for a given index. */
    public getPrivateKey(index: number, pathOptions?: PathOptions) : Uint8Array
    {
        if(this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only")
        return this._hdkManager.derivatePrivateKey(index, pathOptions)
    }

    /** Derives the public key for a given index. */
    public getPublicKey(index: number, pathOptions?: PathOptions) : Uint8Array
    {
        return this._hdkManager.derivatePublicKey(index, pathOptions)
    }

    /** Derives a key pair (private + public) for a given index. */
    public getPairKey(index: number, pathOptions?: PathOptions) : ECPairKey
    {
        if(this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only")
        return this._hdkManager.derivatePairKey(index, {
            network: this.network
        }, pathOptions)
    }

    /** Returns the extended private key (xprv). */
    public getXPriv() : string
    {
        if(this.isWatchOnly)
            throw new Error("The wallet only has the public key, it is read-only")
        return this._hdkManager.getXPriv()
    }

    /** Returns the extended public key (xpub). */
    public getXPub() : string 
    {
        return this._hdkManager.getXPub()
    }
    
    public getWif() : string
    {
        const pairkey = ECPairKey.fromHex(bytesToHex(this.getMasterPrivateKey()),this.network)

        return pairkey.getWif()
    }
}
