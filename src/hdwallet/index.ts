import { ECPairKey } from "../ecpairkey";
import { HDKManager } from "../hdkmanager";
import {  generateMnemonic, mnemonicToSeedSync } from "bip39"

export interface IHDWallet {
    mnemonic: string;
    hdwallet: HDWallet;
}

export class HDWallet 
{
    private _hdkManager: HDKManager;
    public readonly isReadOnly: boolean;

    constructor(masterSeed: Uint8Array) 
    {
        this._hdkManager = HDKManager.fromMasterSeed(masterSeed)
        this.isReadOnly = false
    }

    public static Create(password?: string) : IHDWallet
    {
        const mnemonic = generateMnemonic()

        const masterSeed = mnemonicToSeedSync(mnemonic, password)

        return {
            mnemonic,
            hdwallet: new HDWallet(masterSeed)
        }
    }

    public static Import(mnemonic: string[], password?: string) : IHDWallet
    {
        if(mnemonic.length < 12)
            throw new Error("The seed phrase (mnemonic) must contain at least 12 words")

        const masterSeed = mnemonicToSeedSync(mnemonic.map(w=>w.trim()).join(" "), password)

        return {
            mnemonic: mnemonic.map(w => w.trim()).join(" "),
            hdwallet: new HDWallet(masterSeed)
        }
    }

    public listPairKeys(quantity: number) : ECPairKey[]
    {
        return this._hdkManager.derivateMultiplePairKeys(quantity) 
    }
    
    public listAddresses(quantity: number) : string[]
    {
        return this._hdkManager.derivateMultiplePairKeys(quantity)
            .map(pair => pair.getAddress())
    }
}
