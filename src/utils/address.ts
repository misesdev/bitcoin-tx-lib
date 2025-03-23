import { BNetwork, TypeAddress } from "../types"
import { Bech32 } from "../base/bech32"
import { bytesToHex, checksum, getBytesCount, numberToHex, ripemd160 } from "."
import { Base58 } from "../base/base58"
import { addressToScriptPubKey } from "./txutils"

interface PubkeyProps {
    pubkey: string,
    type?: TypeAddress,
    network?: BNetwork
}

interface HashProps {
    ripemd160: string,
    type?: TypeAddress,
    network?: BNetwork
}

export class Address {

    private static addressPrefix = { "mainnet": 0x00, "testnet": 0x6f }
   
    public static fromPubkey({ pubkey, type="p2wpkh", network="mainnet" } : PubkeyProps) : string {
        
        if(getBytesCount(pubkey) != 33) 
            throw new Error("invalid pubkey, expected a compressed format 33 bytes")

        if (type === "p2wpkh") {
            let bech32 = new Bech32({ publicKey: pubkey, network })

            return bech32.getAddress()
        } else {
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let prefix = String(numberToHex(this.addressPrefix[network], 8, "hex"))

            let pubScript = ripemd160(pubkey, true)
            
            let script = prefix + pubScript //prefixAddress + scriptRipemd160
            
            let checkHash = checksum(script)

            let result = script + checkHash

            return Base58.encode(result)
        }
    }

    public static fromHash({ ripemd160, type="p2wpkh", network="mainnet" } : HashProps) : string {

        if(getBytesCount(ripemd160) != 0x14)
            throw new Error("Invalid hash ripemd160")

        if (type === "p2wpkh") {
            let bech32 = new Bech32({ network })

            let complete = bech32.convert(ripemd160)

            return bech32.encode(complete)
        } else {
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let prefix = String(numberToHex(this.addressPrefix[network], 8, "hex"))

            let script = prefix + ripemd160 //prefixAddress + scriptRipemd160
            // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
            let checkHash = checksum(script)

            let result = script + checkHash

            return Base58.encode(result)
        } 
    }

    static getScriptPubkey(address: string) : string {
        return bytesToHex(addressToScriptPubKey(address))
    }

    static getRipemd160(address: string): string {
        let script = addressToScriptPubKey(address)

        if(script[1] == 0x14 || script[1] == 0x20) 
            return bytesToHex(script.slice(2))
        if(script[0] == 0x76) 
            return bytesToHex(script.slice(3, -2))

        throw new Error("address not supported")
    } 

    static isValid(address: string) : boolean {
        try {
            let script = addressToScriptPubKey(address)

            if(script[1] == 0x14 && script.slice(2).length != 0x14) return false
            if(script[1] == 0x20 && script.slice(2).length != 0x20) return false
            if(script[0] == 0x76 && script.slice(3, -2).length != 0x14) return false

            return true
        } catch { return false }
    }
}
