import { BTransaction } from "./base/txbase";
import { SIGHASH_ALL } from "./constants/generics";
import { base58Decode, hash160ToScript, hexToBytes, numberToHex, numberToHexLE, reverseHexLE, sha256 } from "./utils";

export class P2PKH extends BTransaction {

    public build(): string {

        this.outputScripts = []

        this.outputs.forEach(out => {
            // value little-endian
            var hexValue = numberToHexLE(out.value, 64) // 64bits
            var hash160 = base58Decode(out.address).substring(2, 42) // the 20 bytes -> 160 bits

            // var hash160Length = (hash160.length / 2).toString(26) // 0x14 == 20
            var hexScript = hash160ToScript(hash160) //OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG
            var hexScriptLength = numberToHex(hexScript.length / 2, 8) // ~0x19 = ~25

            this.outputScripts.push({ hexValue, hexScriptLength, hexScript })
        })

        this.inputScripts = []

        this.inputs.forEach(input => {

            var hexTxid = reverseHexLE(input.txid) // txid little endian
            var hexTxindex = numberToHexLE(input.txindex, 32) // little-endian

            // var hash160 = String(base58Decode(input.address)).substring(2, 42) // the 20 bytes -> 160 bits
            var hexScript = input.scriptPubkey // hash160ToScript()
            var hexScriptLength = numberToHex(hexScript.length / 2, 8)

            var hexSequence = input.sequence ? numberToHexLE(input.sequence, 32) : "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexScript, hexScriptLength, hexSequence })
        })

        // signs the transaction => generates the signed script and puts it in hexScriptSig
        this.sign()

        return this.buildRow()
    }

    public getTxid() {
        var transactionRow = this.build()

        var hash256 = sha256(hexToBytes(transactionRow), true)

        // return hash256 little-endian
        return reverseHexLE(hash256)
    }

    private sign() {

        this.inputScripts.forEach(input => {

            var hexTransaction: string = this.buildRow(true)

            input.hexScriptSig = this.buildSignature(hexTransaction)
        })
    }

    private buildRow(toSign: boolean = false) {

        var hexTransaction: string = ""

        if (!toSign) {
            // lock transaction version
            hexTransaction += numberToHexLE(this.version, 32) // hexadecimal 32bits little-endian 1 = 01000000 

            // lock number of imputs 
            hexTransaction += numberToHex(this.inputs.length, 8) // hexadecimal 8bits 1 = 01
        }

        this.inputScripts.forEach(input => {
            if (toSign) {
                // lock transaction version
                hexTransaction += numberToHexLE(this.version, 32) // hexadecimal 32bits little-endian 1 = 01000000 

                // lock number of imputs (always 1 because this is just for subscription)
                hexTransaction += numberToHex(1, 8)// hexadecimal 8bits 1 = 01
            }
            // lock txid in little-endian
            hexTransaction += input.hexTxid

            // lock txindex hexadecimal 32bits little-endian
            hexTransaction += input.hexTxindex

            // lock script length hexadecimal int8 1 = 01
            hexTransaction += toSign ? input.hexScriptLength : numberToHex((input.hexScriptSig ?? "ff")?.length / 2, 8)

            // lock length hexadecimal int8bits + script of last utxo
            hexTransaction += toSign ? input.hexScript : input.hexScriptSig

            // lock sequence utxo
            hexTransaction += input.hexSequence

            // lock number of outputs hexadecimal int8bits
            hexTransaction += numberToHex(this.outputs.length, 8) // hexadecimal 8bits 1 = 01

            this.outputScripts.forEach(output => {
                // lock amount hexadecimal little-endian int64bits 1 = 0100000000000000
                hexTransaction += output.hexValue

                // lock script length hexadecimal int8 1 = 01
                hexTransaction += output.hexScriptLength

                // set the script output
                hexTransaction += output.hexScript
            })

            // set locktime hexadecimal int32bits little-endian 1 = 01000000
            hexTransaction += numberToHexLE(this.locktime, 32)

            if (toSign)
                // set SIGHASH_ALL hexadecimal int32bits little-endian 1 = 01000000
                hexTransaction += numberToHexLE(1, 32)
        })

        return hexTransaction
    }

    private buildSignature(hexTransaction: string) {

        // generate the hash250 from transaction hex
        var hash256 = sha256(hexToBytes(hexTransaction), true)

        // generate the signature from hash256 of transaction hex
        var signature = this.pairKey.signHash(hash256)

        // append the SIGHASH = ~01
        signature += SIGHASH_ALL

        // append the length of signature + SIGHASH hexadecimal int8bits 1 = 01
        signature = numberToHex(signature.length / 2, 8) + signature

        var compressedPublicKey = base58Decode(this.pairKey.getPublicKeyCompressed())

        var compressedPublicKeyLength = numberToHex(compressedPublicKey.length / 2, 8) // hexadecimal int8bits 1 = 01

        var scriptSigned = signature + compressedPublicKeyLength + compressedPublicKey

        return scriptSigned
    }
}