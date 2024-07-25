import { Base58 } from "./base/base58";
import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputLegacy, OutPutScript, OutputTransaction } from "./types";
import { hash160ToScript, hexToBytes, numberToHex, numberToHexLE, reverseHexLE, sha256 } from "./utils";

export class P2PKH extends BaseTransaction {

    public inputs: InputLegacy[] = []
    public outputs: OutputTransaction[] = []
    public inputScripts: InputScript[] = []
    public outputScripts: OutPutScript[] = []

    constructor(pairKey: ECPairKey) {
        super(pairKey)
        this.version = 2
    }

    public addInput(input: InputLegacy) {
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) {
        this.outputs.push(output)
    }

    public build(): string {

        this.inputScripts = []

        this.inputs.forEach(input => {

            let hexTxid: string = String(reverseHexLE(input.txid)) // txid little endian
            let hexTxindex: string = String(numberToHexLE(input.txindex, 32)) // little-endian

            // let hash160 = String(base58Decode(input.address)).substring(2, 42) // the 20 bytes -> 160 bits
            let hexScript: string = input.scriptPubkey ?? "" // hash160ToScript()
            let hexScriptLength: string = String(numberToHex(hexScript?.length / 2, 8))

            let hexSequence: string = input.sequence ? String(numberToHexLE(input.sequence, 32)) : "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexScript, hexScriptLength, hexSequence })
        })

        this.outputScripts = []

        this.outputs.forEach(out => {
            // value little-endian
            let hexValue: string = String(numberToHexLE(out.value, 64)) // 64bits
            let hash160 = Base58.decode(out.address).substring(2, 42) // the 20 bytes -> 160 bits

            // let hash160Length = (hash160.length / 2).toString(26) // 0x14 == 20
            let hexScript: string = String(hash160ToScript(hash160)) //OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG
            let hexScriptLength: string = String(numberToHex(hexScript.length / 2, 8)) // ~0x19 = ~25

            this.outputScripts.push({ hexValue, hexScriptLength, hexScript })
        })

        // signs the transaction => generates the signed script and puts it in hexScriptSig
        this.generateSignatures()

        // return transaction row
        return this.buildRow()
    }

    public generateSignatures() {
        this.inputScripts.forEach(input => {
            let hexTransaction = this.buildToSign(input)

            input.hexScriptSig = String(this.buildSignature(hexTransaction))
        })
    }

    private buildToSign(inputToSign: InputScript): string {
        // set transaction version
        let hexTransaction: string = String(numberToHexLE(this.version, 32)) // hexadecimal 32bits little-endian 1 = 01000000 

        // set number of imputs 
        hexTransaction += String(numberToHex(this.inputs.length, 8)) // hexadecimal 8bits 1 = 01

        this.inputScripts.forEach(input => {
            // set txid in little-endian
            hexTransaction += input.hexTxid

            // set txindex hexadecimal 32bits little-endian
            hexTransaction += input.hexTxindex

            // set script length hexadecimal int8 1 = 01
            hexTransaction += inputToSign.hexScript == input.hexScript ? input.hexScriptLength : "00"

            // set length hexadecimal int8bits + script of last utxo
            hexTransaction += inputToSign.hexScript == input.hexScript ? input.hexScript : ""

            // set sequence utxo
            hexTransaction += input.hexSequence
        })

        // set number of outputs hexadecimal int8bits
        hexTransaction += String(numberToHex(this.outputs.length, 8)) // hexadecimal 8bits 1 = 01

        this.outputScripts.forEach(output => {
            // set amount hexadecimal little-endian int64bits 1 = 0100000000000000
            hexTransaction += output.hexValue

            // set script length hexadecimal int8 1 = 01
            hexTransaction += output.hexScriptLength

            // set the script output
            hexTransaction += output.hexScript
        })

        // set locktime hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += String(numberToHexLE(this.locktime, 32))

        // set SIGHASH_ALL hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += String(numberToHexLE(1, 32))

        return hexTransaction
    }

    private buildRow(): string {

        // includes transaction version
        let hexTransaction: string = String(numberToHexLE(this.version, 32)) // hexadecimal 32bits little-endian 1 = 01000000 

        // includes number of imputs 
        hexTransaction += String(numberToHex(this.inputs.length, 8)) // hexadecimal 8bits 1 = 01

        this.inputScripts.forEach(input => {
            // includes txid in little-endian
            hexTransaction += input.hexTxid

            // includes txindex hexadecimal 32bits little-endian
            hexTransaction += input.hexTxindex

            // includes script length hexadecimal int8 1 = 01
            hexTransaction += String(numberToHex((input.hexScriptSig ?? "ff").length / 2, 8))

            // includes length hexadecimal int8bits + script of last utxo
            hexTransaction += input.hexScriptSig ?? ""

            // includes sequence utxo
            hexTransaction += input.hexSequence
        })

        // includes number of outputs hexadecimal int8bits
        hexTransaction += String(numberToHex(this.outputs.length, 8)) // hexadecimal 8bits 1 = 01

        this.outputScripts.forEach(output => {
            // includes amount hexadecimal little-endian int64bits 1 = 0100000000000000
            hexTransaction += output.hexValue

            // includes script length hexadecimal int8 1 = 01
            hexTransaction += output.hexScriptLength

            // includes the script output
            hexTransaction += output.hexScript
        })

        // includes locktime hexadecimal int32bits little-endian 1 = 01000000
        hexTransaction += String(numberToHexLE(this.locktime, 32))

        return hexTransaction
    }

    public getTxid(): string {
        let transactionRow = this.build()

        let hash256 = sha256(transactionRow, true)

        // return hash256 little-endian
        return String(reverseHexLE(hash256))
    }
}
