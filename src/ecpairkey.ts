const Ecc = require('elliptic').ec
import { Base58 } from "./base/base58";
import { BNetwork, ECOptions, Hex, TypeAddress } from "./types"
import { bytesToHex, checksum, hexToBytes, numberToHex, ripemd160 } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { Address } from "./utils/address";
import { SignatureType } from "@noble/curves/abstract/weierstrass";

export class ECPairKey {

    public privateKey: string;
    public network: BNetwork = "mainnet"
    public cipherCurve = "secp256k1"
    // the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
    static wifPrefixes = { "mainnet": 0x80, "testnet": 0xef }
    // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
    public addressPrefix = { "mainnet": 0x00, "testnet": 0x6f }

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

    public getPublicKeyCompressed(type: "hex"|"base58" = "base58"): string {

        let publicKey = this.getPublicKey()

        let coordinateX = publicKey.substring(2, 66)
        let coordinateY = publicKey.substring(66)

        const lastByteY = parseInt(coordinateY.slice(-2), 16)
        const prefix = (lastByteY % 2 === 0) ? "02" : "03"

        // The prefix byte 0x02 is due to the fact that the key refers to the X coordinate of the curve
        let publicKeyCompressed =  prefix + coordinateX 

        if(type == "hex") return publicKeyCompressed

        return Base58.encode(publicKeyCompressed)
    }

    public signDER(messageHash: Hex) : Hex {
        
        let data = messageHash

        if(typeof(messageHash) !== "object") data = hexToBytes(messageHash)
      
        // generate signatures until it is small
        while(true) {
            let signature : SignatureType = secp256k1.sign(data, this.privateKey, { extraEntropy: true })

            if(signature.hasHighS()) signature.normalizeS()
            
            if(signature.toDERRawBytes()[1] == 0x44) 
                return signature.toDERHex()
        }
    }

    public verifySignature(messageHash: Hex, derSignature: Hex): boolean {

        let message = messageHash
        let signature = derSignature

        if(typeof(messageHash) !== "string")
            message = bytesToHex(messageHash)
        if(typeof(derSignature) !== "string")
            signature = bytesToHex(derSignature)

        return secp256k1.verify(signature, message, this.getPublicKeyCompressed("hex"))
    }

    public getWif(): string {

        // the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
        let prefix = numberToHex(ECPairKey.wifPrefixes[this.network], 8, "hex")

        let privateWif = prefix + this.privateKey

        let check = checksum(privateWif)

        let wif = privateWif + check

        return Base58.encode(wif)
    }

    public getPublicWif(): string {

        // 0x80 is prefix for mainnet and 0xef is byte prefix for testnet
        let prefix = numberToHex(ECPairKey.wifPrefixes[this.network], 8, "hex")

        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        let publicWif = prefix + this.privateKey + "01"

        let check = checksum(publicWif)

        let wif = publicWif + check

        return Base58.encode(wif)
    }

    public getAddress(type: TypeAddress = "p2wpkh"): string {

        let pubkey = this.getPublicKeyCompressed("hex")

        return Address.fromPubkey({ pubkey, type, network: this.network })
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

        // In hex [0x80]
        if (![this.wifPrefixes.mainnet, this.wifPrefixes.testnet].includes(bytes[0])) return false

        let checksumBytes = bytes.slice(bytes.length - 4, bytes.length) //wifHex.substring(wifHex.length - 8)

        let checksumHash = checksum(bytes.slice(0, bytes.length - 4))//wifHex.substring(0, wifHex.length - 8)

        if (checksumHash.toString() !== checksumBytes.toString()) return false;

        return true
    }
}


