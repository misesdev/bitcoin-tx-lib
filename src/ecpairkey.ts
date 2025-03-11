const Ecc = require('elliptic').ec
import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BNetwork, ECOptions, Hex } from "./types"
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

    public signHash(messageHash: Hex): Hex {

        let data = messageHash

        if(typeof(messageHash) !== "object")
            data = hexToBytes(messageHash)

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const signature = keyPair.sign(data)

        if(typeof(messageHash) !== "object")
            return bytesToHex(signature.toDER())

        return signature.toDER()
    }

    public verifySignature(messageHash: Hex, derSignature: Hex): boolean {

        let message = messageHash
        let signature = derSignature

        if(typeof(messageHash) !== "string")
            message = bytesToHex(messageHash)
        if(typeof(derSignature) !== "string")
            signature = bytesToHex(derSignature)


        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        return keyPair.verify(message, signature)
    }

    public getWif(): string {

        let priv = this.privateKey

        // the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
        let prefix = this.network === "mainnet" ? "80" : "ef"
       
        let privateWif = prefix + priv

        let check = checksum(privateWif)

        let wif = privateWif + check

        return Base58.encode(wif)
    }

    public getPublicWif(): string {

        let priv = this.privateKey
       
        // 0x80 is prefix for mainnet and 0xef is byte prefix for testnet
        let prefix = this.network == "mainnet" ? "80" : "ef"

        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        let publicWif = prefix + priv + "01"

        let check = checksum(publicWif)

        let wif = publicWif + check

        return Base58.encode(wif)
    }

    public getAddress(bech32: boolean = false): string {

        let address: string 
        
        if (bech32) {

            let pubkey = Base58.decode(this.getPublicKeyCompressed())
            
            let bech32 = new Bech32({ publicKey: pubkey, network: this.network })

            address = bech32.getAddress()
        } else {

            let publicKey = this.getPublicKey() 
            
            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            let prefix = this.network == "mainnet" ? "00" : "6f"
            
            // the last param to ripemd160 -> true -> ripemd160(sha256(publicKey))
            let pubScript = ripemd160(publicKey, true)

            // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
            //let prefixAddress = this.network == "mainnet" ? "00" : "6f";

            let script = prefix + pubScript //prefixAddress + scriptRipemd160
            // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
            let checkHash = checksum(script)

            let result = script + checkHash

            //address = script + check

            address = Base58.encode(result)
        } 
        return address
    }

    static fromWif(wif: string, options?: ECOptions): ECPairKey {

        let wifHex = Base58.decode(wif)

        if (!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.")

        return new ECPairKey({ privateKey: wifHex.substring(2, wifHex.length - 8), network: options?.network });
    }

    static fromHex({ privateKey, network="mainnet" }: ECOptions) {
        return new ECPairKey({ privateKey, network })
    }

    static verifyWif(wifHex: string): boolean {

        let bytes = hexToBytes(wifHex)
        let prefix = bytes[0] //wifHex.substring(0, 2)

        // In hex [0x80]
        if (!this.wifPrefixes.includes(prefix)) return false

        let checksumBytes = bytes.slice(bytes.length - 4, bytes.length) //wifHex.substring(wifHex.length - 8)
        
        let checksumHash = checksum(bytes.slice(0, bytes.length - 4))//wifHex.substring(0, wifHex.length - 8)

        //checksumHash = checksum(checksumHash)

        if (checksumHash.toString() !== checksumBytes.toString()) return false;

        return true
    }
}


