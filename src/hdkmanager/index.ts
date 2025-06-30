import { HDKey } from "@scure/bip32";
import { bytesToHex, hexToBytes } from "../utils";
import { mnemonicToSeedSync } from "bip39";
import { ECPairKey } from "../ecpairkey";
import { BNetwork } from "../types";

interface HDKParams {
    purpose?: number;
    coinType?: number;
    account?: number;
    change?: number;
    masterSeed: Uint8Array 
}

export class HDKManager {
    
    public purpose: number; // bip44
    public coinType: number; // bitcoin
    public account: number; // account number
    public change: number; // index of address
    private readonly root: HDKey;
    
    constructor(params: HDKParams) 
    {
        this.root = HDKey.fromMasterSeed(params.masterSeed)
        this.purpose = params.purpose ?? 44
        this.coinType = params.coinType ?? 0
        this.account = params.account ?? 0
        this.change = params.change ?? 0
    }
    
    /**
    *   
    */
    public static fromMasterSeed(seed: string) : HDKManager
    {
        return new HDKManager({ masterSeed: hexToBytes(seed) }) 
    }

    public static fromMnemonic(mnemonic: string, password: string = "") : HDKManager
    {
        const masterSeed = mnemonicToSeedSync(mnemonic, password)

        return new HDKManager({ masterSeed })
    }

    public getKey(index: number) : Uint8Array 
    {
        let path = `m/${this.purpose}'/${this.coinType}'/${this.account}'/${this.change}/${index}`
        let child = this.root.derive(path)

        if(!child.privateKey)
            throw new Error("missing private key")

        return child.privateKey;
    }

    public listHDKeys(quantity: number) : Uint8Array[]
    {
        let result: Uint8Array[] = []

        for(let i = 0; i < quantity; i++)
        {
            try {
                result.push(this.getKey(i))
            } 
            catch {}
        }

        return result;    
    }

    public getPairKey(index: number, network: BNetwork = "mainnet") : ECPairKey
    {
        let privateKey = bytesToHex(this.getKey(index))

        return ECPairKey.fromHex({ privateKey, network })
    }

    public listPairKeys(quantity: number, network: BNetwork = "mainnet") : ECPairKey[]
    {
        let result: ECPairKey[] = []
        for(let i = 0; i < quantity; i++)
        {
            try {
                let privateKey = bytesToHex(this.getKey(i))
                result.push(ECPairKey.fromHex({ privateKey, network }))
            } 
            catch {}
        }
        return result
    }
}
