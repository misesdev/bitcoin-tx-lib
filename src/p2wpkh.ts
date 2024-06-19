import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BTransaction } from "./base/txbase";
import { SIGHASH_ALL } from "./constants/generics";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputSegwit, OutPutScript, OutputTransaction } from "./types";
import { hexToBytes, numberToHex, numberToHexLE, reverseHexLE, sha256 } from "./utils";

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

            // let hash160 = String(base58Decode(input.address)).substring(2, 42) // the 20 bytes -> 160 bits
            let hexScript = input.scriptPubkey // hash160ToScript()
            let hexScriptLength = numberToHex(hexScript.length / 2, 8)

            let hexSequence = input.sequence ? numberToHexLE(input.sequence, 32) : "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexValue, hexScript, hexScriptLength, hexSequence })
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
        hexTransaction += input.hexScriptLength

        // set length hexadecimal int8bits + script of last utxo
        hexTransaction += input.hexScript

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
        return "";
    }

    public getTxid() {
        let transactionRow = this.build()

        let hash256 = sha256(hexToBytes(transactionRow), true)

        // return hash256 little-endian
        return reverseHexLE(hash256)
    }
}