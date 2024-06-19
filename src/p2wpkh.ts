import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BTransaction } from "./base/txbase";
import { SIGHASH_ALL } from "./constants/generics";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { hexToBytes, numberToHex, numberToHexLE, reverseHexLE, sha256 } from "./utils";

export class P2WPKH extends BTransaction {

    constructor(pairKey: ECPairKey) {
        super(pairKey)
        this.version = 2
    }

    public build(): string {

        let bech32 = new Bech32({
            publicKey: Base58.decode(this.pairKey.getPublicKeyCompressed()),
            network: this.pairKey.network
        })

        this.inputScripts = []

        this.inputs.forEach(input => {

            let hexTxid = reverseHexLE(input.txid) // txid little endian
            let hexTxindex = numberToHexLE(input.txindex, 32) // little-endian

            // let hash160 = String(base58Decode(input.address)).substring(2, 42) // the 20 bytes -> 160 bits
            let hexScript = input.scriptPubkey // hash160ToScript()
            let hexScriptLength = numberToHex(hexScript.length / 2, 8)

            let hexSequence = input.sequence ? numberToHexLE(input.sequence, 32) : "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexScript, hexScriptLength, hexSequence })
        })

        this.outputScripts = []

        this.outputs.forEach(out => {
            // value little-endian
            let hexValue = numberToHexLE(out.value, 64) // 64bits
            let hash160 = bech32.getScriptPubkey(out.address) // the 20 bytes -> 160 bits

            let hash160Length = (hash160.length / 2).toString(16) // 0x14 == 20
            let hexScript = OP_CODES.OP_0 + hash160Length + hash160 //OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG
            let hexScriptLength = numberToHex(hexScript.length / 2, 8) // ~0x19 = ~25

            this.outputScripts.push({ hexValue, hexScriptLength, hexScript })
        })

        // signs the transaction => generates the signed script and puts it in hexScriptSig
        this.sign()

        return this.buildRow()
    }

    public getTxid() {
        let transactionRow = this.build()

        let hash256 = sha256(hexToBytes(transactionRow), true)

        // return hash256 little-endian
        return reverseHexLE(hash256)
    }

    private sign() {

        this.inputScripts.forEach((input, index) => {

            let hexTransaction: string = this.buildRow(true, index)

            input.hexScriptSig = this.buildSignature(hexTransaction)
        })
    }

    private buildRow(toSign: boolean = false, inputToSign: number = 0) {

        // set transaction version
        let hexTransaction: string = numberToHexLE(this.version, 32) // hexadecimal 32bits little-endian 1 = 01000000 

        if (!toSign)
            // set the marker and sinalizer 0x00 and 0x01 (SegWit)
            hexTransaction += "0001"

        // set number of imputs 
        hexTransaction += numberToHex(this.inputs.length, 8) // hexadecimal 8bits 1 = 01

        this.inputScripts.forEach((input, index) => {
            // set txid in little-endian
            hexTransaction += input.hexTxid

            // set txindex hexadecimal 32bits little-endian
            hexTransaction += input.hexTxindex

            if (toSign) {
                // set script length hexadecimal int8 1 = 01
                hexTransaction += inputToSign == index ? input.hexScriptLength : "00"

                // set length hexadecimal int8bits + script of last utxo
                hexTransaction += inputToSign == index ? input.hexScript : ""

            } else {
                // set script length hexadecimal int8 1 = 01
                hexTransaction += numberToHex((input.hexScriptSig ?? "ff").length / 2, 8)

                // set length hexadecimal int8bits + script of last utxo
                hexTransaction += input.hexScriptSig
            }
            // set sequence utxo
            hexTransaction += input.hexSequence

        })

        // set number of outputs hexadecimal int8bits
        hexTransaction += numberToHex(this.outputs.length, 8) // hexadecimal 8bits 1 = 01

        this.outputScripts.forEach(output => {
            // set amount hexadecimal little-endian int64bits 1 = 0100000000000000
            hexTransaction += output.hexValue

            // set script length hexadecimal int8 1 = 01
            hexTransaction += output.hexScriptLength

            // set the script output
            hexTransaction += output.hexScript
        })

        if (!toSign) { // Add SegWit itens
            let witnesses = numberToHex(this.inputs.length, 8)

            // add the number of witnesses
            hexTransaction += witnesses

            // set locktime hexadecimal int32bits little-endian 1 = 01000000
            hexTransaction += numberToHexLE(this.locktime, 32)
        }

        if (toSign)
            // set SIGHASH_ALL hexadecimal int32bits little-endian 1 = 01000000
            hexTransaction += numberToHexLE(1, 32)

        return hexTransaction
    }

    private buildSignature(hexTransaction: string) {

        // generate the hash250 from transaction hex
        let hash256 = sha256(hexToBytes(hexTransaction), true)

        // generate the signature from hash256 of transaction hex
        let signature = this.pairKey.signHash(hash256)

        // append the SIGHASH = ~01
        signature += SIGHASH_ALL

        // append the length of signature + SIGHASH hexadecimal int8bits 1 = 01
        signature = numberToHex(signature.length / 2, 8) + signature

        let compressedPublicKey = this.pairKey.getPublicKeyCompressed()

        let compressedPublicKeyLength = numberToHex(compressedPublicKey.length / 2, 8) // hexadecimal int8bits 1 = 01

        let scriptSigned = signature + compressedPublicKeyLength + compressedPublicKey

        return scriptSigned
    }
}