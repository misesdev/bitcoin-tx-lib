import { SIGHASH_ALL } from "../constants/generics"
import { ECPairKey } from "../ecpairkey"
import { hexToBytes, numberToHex, sha256 } from "../utils"
import { Base58 } from "./base58"

export class BaseTransaction {

    public version: number = 1
    public locktime: number = 0
    public pairKey: ECPairKey
    
    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }

    protected buildSignature(hexTransaction: string) {

        // generate the hash250 from transaction hex
        let hash256 = sha256(hexToBytes(hexTransaction), true)

        // generate the signature from hash256 of transaction hex
        let signature = this.pairKey.signHash(hash256)

        // append the SIGHASH = ~01
        signature += SIGHASH_ALL

        // append the length of signature + SIGHASH hexadecimal int8bits 1 = 01
        signature = numberToHex(signature.length / 2, 8) + signature

        let compressedPublicKey = Base58.decode(this.pairKey.getPublicKeyCompressed())

        let compressedPublicKeyLength = numberToHex(compressedPublicKey.length / 2, 8) // hexadecimal int8bits 1 = 01

        let scriptSigned = signature + compressedPublicKeyLength + compressedPublicKey

        return scriptSigned
    }
}
