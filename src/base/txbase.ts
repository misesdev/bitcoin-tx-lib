import { SIGHASH_ALL } from "../constants/generics"
import { ECPairKey } from "../ecpairkey"
import { Hex } from "../types"
import { bytesToHex, hexToBytes, numberToHex, sha256 } from "../utils"
import { Base58 } from "./base58"

export class BaseTransaction {

    public version: number = 1
    public locktime: number = 0
    public pairKey: ECPairKey
    
    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }

    protected buildSignature(hexTransaction: Hex): Hex {

        let data = hexTransaction

        if(typeof(hexTransaction) !== "string")
            data = bytesToHex(hexTransaction)

        // generate the hash250 from transaction hex
        let hash256 = sha256(data, true)

        // generate the signature from hash256 of transaction hex
        let signature = this.pairKey.signHash(hash256)

        // append the SIGHASH = ~01
        signature += SIGHASH_ALL

        // append the length of signature + SIGHASH hexadecimal int8bits 1 = 01
        signature = String(numberToHex(signature.length / 2, 8, "string")) + signature

        let compressedPublicKey = Base58.decode(this.pairKey.getPublicKeyCompressed())

        let compressedPublicKeyLength = String(numberToHex(compressedPublicKey.length / 2, 8, "string")) // hexadecimal int8bits 1 = 01

        let scriptSigned = signature + compressedPublicKeyLength + compressedPublicKey

        if(typeof(hexTransaction) === "object")
            return hexToBytes(scriptSigned)
    
        return scriptSigned
    }
}


