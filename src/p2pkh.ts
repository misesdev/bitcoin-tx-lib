import { ECPairKey } from "./ecpairkey";
import { InputScript, InputTransaction, OutPutScript, OutputTransaction } from "./types";
import { base58Decode, bytesToHex, hash160ToScript, hexToBytes, numberToHex, numberToHexLE } from "./utils";

export class P2PKH {

    public pairKey: ECPairKey;
    public inputs: InputTransaction[] = [] 
    private inputScripts: InputScript[] = []
    public outputs: OutputTransaction[] = []
    private outputScripts: OutPutScript[] = []

    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }

    public addInput(input: InputTransaction) {
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) {
        this.outputs.push(output)
    }

    public build(): string {
        
        this.outputs.forEach(out => {
            // value little-endian
            var hexValue = String(numberToHexLE(out.value, 64)) // 64bits
            var hash160 = String(base58Decode(out.address)).substr(2, 40) // the 20 bytes -> 160 bits

            // var hash160Length = (hash160.length / 2).toString(26) // 0x14 == 20
            var hexScript = hash160ToScript(hash160) //OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG
            var hexScriptLength = (hexScript.length / 2).toString(16) // ~0x19 = ~25

            this.outputScripts.push({ hexValue, hexScriptLength, hexScript })
        })

        this.inputs.forEach(input => {

            var hexTxid = bytesToHex(hexToBytes(input.txid).reverse()).toString() // txid little endian
            var hexTxindex = numberToHexLE(input.txindex, 32).toString() // little-endian

            // var hash160 = String(base58Decode(input.address)).substr(2, 40) // the 20 bytes -> 160 bits
            var hexScript = input.scriptPubkey // hash160ToScript()
            var hexScriptLength = (hexScript.length / 2).toString(16)

            var hexSequence = "ffffffff" // 0xffffffff - 32bits

            this.inputScripts.push({ hexTxid, hexTxindex, hexScript, hexScriptLength, hexSequence })
        })

        console.log(this.inputScripts)
        console.log(this.outputScripts)

        return "transaction bytes"
    }

    static create() {
        
    }
}