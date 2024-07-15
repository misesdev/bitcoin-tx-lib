const Ecc = require('elliptic').ec
import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BNetwork, ECOptions } from "./types"
import { bytesToHex, checksum, hexToBytes, mergeUint8Arrays, ripemd160, sha256 } from "./utils";

export class ECPairKey {

    public privateKey: string;
    public network: BNetwork = "mainnet"
    public cipherCurve = "secp256k1"
    static wifPrefixes = new Uint8Array([0x80, 0xef])

    private elliptic = new Ecc(this.cipherCurve ?? "secp256k1")

    constructor(options?: ECOptions) {
        this.network = options?.network ?? "mainnet"
        this.privateKey = options?.privateKey ?? this.elliptic.genKeyPair().getPrivate("hex")
    }

    public getPublicKey(): string {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const pubPoint = keyPair.getPublic()

        return pubPoint.encode("hex")
    }

    public getPublicKeyCompressed(): string {
        
        let publicKey = this.getPublicKey()

        let X = publicKey.substring(2, 66)
        // let Y = publicKey.substring(66)
        let prefix = "03" 
        let coordinate = X

        // The prefix byte 0x02 is due to the fact that the key refers to the X coordinate of the curve
        let publicKeyCompressed =  prefix + coordinate 

        return Base58.encode(publicKeyCompressed)
    }

    public signHash(messageHash: string): Uint8Array {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const signature = keyPair.sign(messageHash)

        return signature.toDER()
    }

    public verifySignature(messageHash: string, derSignature: string): boolean {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        return keyPair.verify(messageHash, derSignature)
    }

    public getWif(): string {

        let priv = hexToBytes(this.privateKey)

        let prefix = this.network === "mainnet" ? new Uint8Array([0x80]) : new Uint8Array([0xef])
       
        let privateWif = mergeUint8Arrays(prefix, priv)

        let check = checksum(privateWif)

        let wif = mergeUint8Arrays(privateWif, check)

        return Base58.encode(bytesToHex(wif))
    }

    public getPublicWif(): string {

        let priv = hexToBytes(this.privateKey)
        
        let prefix = this.network == "mainnet" ? new Uint8Array([0x80]) : new Uint8Array([0xef])

        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        let publicWif = mergeUint8Arrays(prefix, priv, new Uint8Array([0x01]))

        let check = checksum(publicWif)

        let wif = mergeUint8Arrays(publicWif, check)

        return Base58.encode(bytesToHex(wif))
    }

    public getAddress(bech32: boolean = false): string {

        let address: string 
        
        if (bech32) {

            let pubkey = Base58.decode(this.getPublicKeyCompressed())
            
            let bech32 = new Bech32({ publicKey: pubkey, network: this.network })

            address = bech32.getAddress()
        } else {

            let publicKey = hexToBytes(this.getPublicKey()) 
            
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let prefix = new Uint8Array([this.network == "mainnet"? 0x00 : 0x6f])
            
            // the last param to ripemd160 -> true -> ripemd160(sha256(publicKey))
            let pubScript = ripemd160(publicKey, true)

            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            //let prefixAddress = this.network == "mainnet" ? "00" : "6f";

            let script = mergeUint8Arrays(prefix, pubScript)//prefixAddress + scriptRipemd160
            // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
            let checkHash = checksum(script)

            let result = mergeUint8Arrays(script, checkHash)

            //address = script + check

            address = Base58.encode(bytesToHex(result))
        } 
        return address
    }

    static fromWif(wif: string, options?: ECOptions): ECPairKey {

        let wifHex = Base58.decode(wif)

        if (!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.")

        return new ECPairKey({ privateKey: wifHex.substring(2, wifHex.length - 8), network: options?.network });
    }

    static verifyWif(wifHex: string): boolean {

        let bytes = hexToBytes(wifHex)
        let prefix = bytes[0] //wifHex.substring(0, 2)

        // In hex [0x80]
        if (!this.wifPrefixes.includes(prefix)) return false

        let checksumBytes = bytes.slice(bytes.length - 4, bytes.length) //wifHex.substring(wifHex.length - 8)
        
        let checksumHash = bytes.slice(0, bytes.length - 4)//wifHex.substring(0, wifHex.length - 8)

        checksumHash = checksum(checksumHash)

        if (checksumHash.toString() !== checksumBytes.toString()) return false;

        return true
    }
}


