const Ecc = require('elliptic').ec
import { Hex } from "./types"
import { base58Decode, base58Encode, hexToBytes, ripemd160, sha256 } from "./utils";

export class ECPairKey {

    public privateKey;
    // private key 0x80
    public wifPrefix = 0x80;
    // minnet 0x00
    public network = "00"
    public cipherCurve = "secp256k1"

    private elliptic = new Ecc(this.cipherCurve ?? "secp256k1")

    constructor(privateKey?: Hex) {
        this.privateKey = privateKey ?? this.elliptic.genKeyPair().getPrivate("hex")
    }

    public getPublicKey(): Hex {

        const keyPair = this.elliptic.keyFromPrivate(this.privateKey)

        const pubPoint = keyPair.getPublic()

        return pubPoint.encode("hex")
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

        var wif: string = this.wifPrefix.toString(16) + this.privateKey

        // first 4 bytes 
        wif += sha256(hexToBytes(wif), true)

        return base58Encode(wif)
    }

    public getAddress() {
        var publicKey = this.getPublicKey()

        // the last param to ripemd160 -> true -> ripemd160(sha256(publicKey))
        var scriptRipemd160 = ripemd160(hexToBytes(publicKey.toString()), true)

        var script = this.network + scriptRipemd160.toString()
        // the last param to sha256 -> true -> sha256(sha256(script)).substring(0, 8) - is a checksum(first 4 bytes)
        var checksum = sha256(hexToBytes(script), true)

        var address = script + checksum

        return base58Encode(address)
    }

    static fromWif(wif: string) : ECPairKey {

        var wifHex = base58Decode(wif)

        if(!this.verifyWif(wifHex))
            throw new Error("Wif type is not supported, only private key wif are suported.")

        return new ECPairKey(String(wifHex).substring(2, wifHex.length - 8));
    }

    static verifyWif(wifHex: Hex) : boolean {

        var prefix = parseInt(String(wifHex).substr(0, 2), 16)
        
        // In hex [0x80]
        if(![128].includes(prefix)) return false

        var checksum = String(wifHex).substring(wifHex.length - 8)
        var checksumHash = String(wifHex).substring(0, wifHex.length - 8)

        checksumHash = sha256(hexToBytes(checksumHash), true).toString()

        if(checksumHash !== checksum) return false;

        return true
    }
}