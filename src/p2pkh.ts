import { SIGHASH_ALL } from "./constants/generics";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputTransaction, OutPutScript, OutputTransaction } from "./types";
import { base58Decode, bytesToHex, hash160ToScript, hexToBytes, numberToHex, numberToHexLE, sha256 } from "./utils";

export class P2PKH {

    public pairKey: ECPairKey;
    public version: number = 0
    public locktime: number = 0
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

        // signs the transaction => generates the signed script and puts it in hexScriptSig
        this.sign()

        // console.log(this.inputScripts)
        // console.log(this.outputScripts)

        return "transaction bytes"
    }

    private sign() {

        var hexTransaction: string = ""
        // lock transaction version
        hexTransaction += numberToHexLE(this.version, 32) // hexadecimal 32bits little-endian 1 = 01000000 

        // lock number of imputs
        hexTransaction += numberToHex(this.inputs.length, 8) // hexadecimal 8bits 1 = 01

        this.inputScripts.forEach(input => {
            // lock txid in little-endian
            hexTransaction += input.hexTxid
            
            // lock txindex hexadecimal 32bits little-endian
            hexTransaction += input.hexTxindex
            
            // lock script length hexadecimal int8 1 = 01
            hexTransaction += input.hexScriptLength
            
            // lock length hexadecimal int8bits + script of last utxo
            hexTransaction += input.hexScript
            
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

            // set locktime hexadecimal int32bits little-endian 1 = 01000000
            hexTransaction += numberToHexLE(1, 32)

            input.hexScriptSig = this.buildSignature(hexTransaction)

            console.log(input.hexScriptSig)
        })
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

        var compressedPublicKeyLength = numberToHex(compressedPublicKey.length, 8) // hexadecimal int8bits 1 = 01

        var scriptSigned = signature + compressedPublicKeyLength + compressedPublicKey

        return scriptSigned
    }
}