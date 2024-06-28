import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BTransaction } from "./base/txbase";
import { SIGHASH_ALL } from "./constants/generics";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputSegwit, OutPutScript, OutputTransaction } from "./types";
import { hash160ToScript, hexToBytes, numberToHex, numberToHexLE, reverseHexLE, sha256 } from "./utils";

export class P2WPKH extends BTransaction {

    public inputs: InputSegwit[] = []
    public outputs: OutputTransaction[] = []
    public inputScripts: InputScript[] = []
    public outputScripts: OutPutScript[] = []

    constructor(pairKey: ECPairKey) {
        super(pairKey)
        this.version = 2
    }

    public addInput(input: InputSegwit) {
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) {
        this.outputs.push(output)
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
            let hexValue = numberToHexLE(input.value, 64) // value little-endian 64bits

            let hash160 = bech32.getScriptPubkey(input.address ?? "") // the 20 bytes -> 160 bits
            let hexScriptToSig = hash160ToScript(hash160)
            let hexScriptToSigLength = numberToHex(hexScriptToSig.length, 8)
            hexScriptToSig = hexScriptToSigLength + hexScriptToSig

            let hexScript = numberToHex(input.scriptPubkey.length / 2, 8) + input.scriptPubkey 
            let hexScriptLength = numberToHex(hexScript.length / 2, 8)

            let hexSequence = input.sequence ? numberToHexLE(input.sequence, 32) : "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexValue, hexScript, hexScriptLength, hexScriptToSig, hexSequence })
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
        this.generateSignatures()

        return this.buildRow()
    }

    public generateSignatures() {

        this.inputScripts.forEach((input) => {

            let hexTransaction: string = this.buildToSign(input)

            input.hexScriptSig = this.buildSignature(hexTransaction)
        })
    }

    private buildToSign(input: InputScript) {

        // set transaction version
        let hexTransaction: string = numberToHexLE(this.version, 32) // hexadecimal 32bits little-endian 1 = 01000000 

        // set hash outpoint segwit of all inputs
        hexTransaction += sha256(hexToBytes(this.inputScripts.map(x => x.hexTxid + x.hexTxindex).join("")), true)
        // set hash sequence
        hexTransaction += sha256(hexToBytes(this.inputScripts.map(x => x.hexSequence).join("")), true)

        // set txid in little-endian
        hexTransaction += input.hexTxid

        // set txindex hexadecimal 32bits little-endian
        hexTransaction += input.hexTxindex

        // set script length hexadecimal int8 1 = 01
        // hexTransaction += input.hexScriptLength

        // set length hexadecimal int8bits + script of last utxo
        hexTransaction += input.hexScriptToSig

        // set value int64 hexadecimal little-endian
        hexTransaction += input.hexValue

        // set sequence utxo
        hexTransaction += input.hexSequence

        // set hash outputs 
        hexTransaction += sha256(hexToBytes(this.outputScripts.map(x => x.hexValue + x.hexScriptLength + x.hexScript).join("")), true)

        // set locktime hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += numberToHexLE(this.locktime, 32)

        // set SIGHASH_ALL hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += numberToHexLE(1, 32)

        return hexTransaction
    }

    private buildRow() {

        // includes the transaction version
        let hexTransaction: string = numberToHexLE(this.version, 32)

        // includes the segwit marker 0x00 and flag 0x01 which allow nodes to identify this as a SegWit transaction
        hexTransaction += "0001"

        // includes the number of inputs
        hexTransaction += numberToHexLE(this.inputs.length, 8)

        this.inputScripts.forEach(input => {
            // includes the txid
            hexTransaction += reverseHexLE(input.hexTxid)
            // includes the tx index
            hexTransaction += input.hexTxindex

            if (input.hexScript.substring(2, 6) == "76a9")
                // includes the scriptSig which in the segwit case is 0x00 as the scriptsig will be in the witness field
                hexTransaction += "00"

            if (input.hexScript.substring(2, 6) !== "76a9") {
                hexTransaction += input.hexScriptLength
                hexTransaction += input.hexScript
            }
            // includes the sequence 
            hexTransaction += input.hexSequence
        })

        // includes number of outputs hexadecimal int8bits
        hexTransaction += numberToHex(this.outputs.length, 8) // hexadecimal 8bits 1 = 01

        this.outputScripts.forEach(output => {
            // includes amount hexadecimal little-endian int64bits 1 = 0100000000000000
            hexTransaction += output.hexValue

            // includes script length hexadecimal int8 1 = 01
            hexTransaction += output.hexScriptLength

            // includes the script output
            hexTransaction += output.hexScript
        })

        // the witness field
        this.inputScripts.forEach(input => {
            // quantity of items
            hexTransaction += "02"
            // signature length + signature and publickey length + publickey
            hexTransaction += input.hexScriptSig
        })

        // includes locktime hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += numberToHexLE(this.locktime, 32)

        return hexTransaction
    }

    public getTxid() {
        let transactionRow = this.build()

        let hash256 = sha256(hexToBytes(transactionRow), true)

        // return hash256 little-endian
        return reverseHexLE(hash256)
    }
}