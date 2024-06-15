const Ecc = require('elliptic').ec
import { Base58 } from "./base/base58";
import { BNetwork, ECOptions, Hex } from "./types"
import { bytesToHex, checksum, hexToBytes, ripemd160, sha256 } from "./utils";

export class ECPairKey {

    public privateKey: string;
    public network: BNetwork = "mainnet"
    public cipherCurve = "secp256k1"
    static wifPrefixes = ["80", "ef"]

    private elliptic = new Ecc(this.cipherCurve ?? "secp256k1")

    constructor(options?: ECOptions) {
        this.network = options?.network ? options?.network : "mainnet"
        this.privateKey = options?.privateKey ?? this.elliptic.genKeyPair().getPrivate("hex")
    }

    public getPublicKey(): string {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const pubPoint = keyPair.getPublic()

        return pubPoint.encode("hex")
    }

    public getPublicKeyCompressed(): string {
        var publicKey = this.getPublicKey()

        var coordinateX = publicKey.substring(2, 66)

        // The prefix byte 0x02 is due to the fact that the key refers to the X coordinate of the curve
        var publicKeyCompressed = "02" + coordinateX

        return Base58.encode(publicKeyCompressed)
    }

    public signHash(messageHash: string): string {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const signature = keyPair.sign(messageHash)

        return bytesToHex(signature.toDER())
    }

    public verifySignature(messageHash: string, derSignature: string): boolean {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        return keyPair.verify(messageHash, derSignature)
    }

    public getWif(): string {

        // bytes prefix 0x80 and 0xef (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
        var wifPrefix = this.network == "mainnet" ? "80" : "ef"

        var wif: string = wifPrefix + this.privateKey

        // first 4 bytes 
        wif += checksum(hexToBytes(wif))

        return Base58.encode(wif)
    }

    public getPublicWif(): string {
        var prefix = this.network == "mainnet" ? "80" : "ef"

        // the 0x01 byte added at the end indicates that it is a compressed public key (doc: https://en.bitcoin.it/wiki/Wallet_import_format)
        var publicWif = prefix + this.privateKey + "01"

        publicWif += checksum(hexToBytes(publicWif))

        return Base58.encode(publicWif)
    }

    public getAddress(): string {
        var publicKey = this.getPublicKey()

        // the last param to ripemd160 -> true -> ripemd160(sha256(publicKey))
        var scriptRipemd160 = ripemd160(hexToBytes(publicKey.toString()), true)

        // byte prefix 0x00 and 0x6f (doc: https://en.bitcoin.it/wiki/List_of_address_prefixes)
        var prefixAddress = this.network == "mainnet" ? "00" : "6f";

        var script = prefixAddress + scriptRipemd160.toString()
        // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
        var check = checksum(hexToBytes(script))

        var address = script + check

        return Base58.encode(address)
    }

    static fromWif(wif: string, options?: ECOptions): ECPairKey {

        var wifHex = Base58.decode(wif)

        if (!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.")

        return new ECPairKey({ privateKey: wifHex.substring(2, wifHex.length - 8), network: options?.network });
    }

    static verifyWif(wifHex: string): boolean {

        var prefix = wifHex.substring(0, 2)

        // In hex [0x80]
        if (!this.wifPrefixes.includes(prefix.toLowerCase())) return false

        var checksumBytes = wifHex.substring(wifHex.length - 8)
        var checksumHash = wifHex.substring(0, wifHex.length - 8)

        checksumHash = checksum(hexToBytes(checksumHash))

        if (checksumHash !== checksumBytes) return false;

        return true
    }
}