const Ecc = require('elliptic').ec
import { Hex } from "./types"
import { base58Decode, base58Encode, checksum, hexToBytes, ripemd160, sha256 } from "./utils";

type BNetwork = "testnet" | "mainet"

interface ECOptions {
    network?: BNetwork,
    privateKey?: Hex
}

export class ECPairKey {

    public privateKey: Hex;
    public network: BNetwork = "mainet"
    public cipherCurve = "secp256k1"
    static wifPrefixes = ["80", "ef"]

    private elliptic = new Ecc(this.cipherCurve ?? "secp256k1")

    constructor(options?: ECOptions) {
        this.network = options?.network ? options?.network : "mainet"
        this.privateKey = options?.privateKey ?? this.elliptic.genKeyPair().getPrivate("hex")
    }

    public getPublicKey(): Hex {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const pubPoint = keyPair.getPublic()

        return pubPoint.encode("hex")
    }

    public getPublicKeyCompressed() {
        var publicKey = String(this.getPublicKey())

        var coordinateX = publicKey.substr(2, 64)
        
        // The prefix byte 0x02 is due to the fact that the key refers to the X coordinate of the curve
        var publicKeyCompressed = "02" + coordinateX

        return base58Encode(publicKeyCompressed)
    }

    public signHash(messageHash: string): Hex {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const signature = keyPair.sign(messageHash)

        return signature.toDER()
    }

    public verifySignature(messageHash: string, derSignature: Hex): boolean {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        return keyPair.verify(messageHash, derSignature)
    }

    public getWif(): Hex {

        // bytes prefix 0x80 and 0xef (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
        var wifPrefix = this.network == "mainet" ? "80" : "ef" 

        var wif: string = wifPrefix + this.privateKey

        // first 4 bytes 
        wif += checksum(hexToBytes(wif))

        return base58Encode(wif)
    }

    public getPublicWif(): Hex {
        var prefix = this.network == "mainet" ? "80" : "ef"

        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        var publicWif = prefix + this.privateKey + "01"

        publicWif += checksum(hexToBytes(publicWif))

        return base58Encode(publicWif)
    }

    public getAddress(): string {
        var publicKey = this.getPublicKey()

        // the last param to ripemd160 -> true -> ripemd160(sha256(publicKey))
        var scriptRipemd160 = ripemd160(hexToBytes(publicKey.toString()), true)

        // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
        var prefixAddress = this.network == "mainet" ? "00" : "6f";

        var script = prefixAddress + scriptRipemd160.toString()
        // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
        var check = checksum(hexToBytes(script))

        var address = script + check

        return base58Encode(address)
    }

    static fromWif(wif: string, options?: ECOptions) : ECPairKey {

        var wifHex = base58Decode(wif)

        if(!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.")

        return new ECPairKey({ privateKey: String(wifHex).substring(2, wifHex.length - 8), network: options?.network });
    }

    static verifyWif(wifHex: Hex) : boolean {

        var prefix = String(wifHex).substr(0, 2)
        
        // In hex [0x80]
        if(!this.wifPrefixes.includes(prefix.toLowerCase())) return false

        var checksumBytes = String(wifHex).substring(wifHex.length - 8)
        var checksumHash = String(wifHex).substring(0, wifHex.length - 8)

        checksumHash = checksum(hexToBytes(checksumHash))

        if(checksumHash !== checksumBytes) return false;

        return true
    }
}