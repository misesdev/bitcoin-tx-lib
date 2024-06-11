import { genatePrivateKey } from "./keygen";
import { Hex } from "./types";

export class ECPairKey {

    public privateKey;
    // private key 0x80 
    public wifPrefix = '80';

    private bs58 = require("bs58")
    private eccrypto = require("eccrypto")
    private crypto = require("cryptojs").Crypto

    constructor(privateKey?: Hex) {
        this.privateKey = privateKey ?? genatePrivateKey()
    }

    public getPublicKey(): Hex {
        return this.eccrypto.getPublic(this.crypto.util.hexToBytes(this.privateKey))
    }

    public signHash(hash: string): Hex {
        return "signature hash"
    }

    public getWif(): Hex {

        var wif: string = this.wifPrefix + this.privateKey

        var checksum: string = this.crypto.SHA256(this.crypto.util.hexToBytes(wif))

        checksum = this.crypto.SHA256(this.crypto.util.hexToBytes(checksum))

        wif += checksum.substring(0, 8)

        return this.bs58.encode(this.crypto.util.hexToBytes(wif))
    }
}