import { BaseTransaction } from "./base/txbase";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { BNetwork, Hex } from "./types";
import { InputTransaction, OutputTransaction } from "./types/transaction"
import { bytesToHex, getBytesCount, hash160ToScript, hexToBytes, 
    numberToHex, numberToHexLE, numberToVarTnt, reverseEndian, 
    sha256 } from "./utils";
import { addressToScriptPubKey } from "./utils/txutils";

interface TXOptions {
    version?: number;
    network: BNetwork;
}

export class Transaction extends BaseTransaction {
 
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    private network: BNetwork = "mainnet"

    constructor(pairkey: ECPairKey, options?: TXOptions) 
    {
        super(pairkey)
        this.version = options?.version ?? 2
        this.network = options?.network ?? "mainnet"
    }

    public addInput(input: InputTransaction) 
    {  
        if(input.txid.length < 10)
            throw new Error("Expected txid value")
        else if(!input.scriptPubKey)
            throw new Error("Expected scriptPubKey")
        
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) 
    {
        if(output.address.length <= 10)
            throw new Error("Expected address value")
        if(output.amount <= 0)
            throw new Error("Expected a valid amount")

        this.outputs.push(output)
    }

    public build(): string 
    {        
        let segwitData: string = ""
        
        let hexTransaction = String(numberToHexLE(this.version, 32)) // version

        if(this.isSegwit()) // Marker e Flag for SegWit transactions
            hexTransaction += bytesToHex(new Uint8Array([0x00, 0x01])) //"00" + "01";

        hexTransaction += numberToVarTnt(this.inputs.length) // number of inputs

        this.inputs.forEach((input, index) => {
            hexTransaction += reverseEndian(input.txid) // txid
            hexTransaction += numberToHexLE(input.vout, 32) // index output (vout)

            if(this.isSegwitInput(input)) {
                const scriptSig = this.generateSegWitScriptSig(index, "hex") as string
                segwitData += "00"+scriptSig
                hexTransaction += "00" // script sig in witness area // P2WPKH 
            } else {
                const scriptSig = this.generateScriptSig(index, "hex") as string
                hexTransaction += scriptSig
            }
            hexTransaction += "ffffffff" // 0xffffffff
        })

        hexTransaction += numberToVarTnt(this.outputs.length) // number of outputs

        this.outputs.forEach(output => {
            hexTransaction += numberToHexLE(output.amount, 64)
            const scriptPubKey = addressToScriptPubKey(output.address)
            hexTransaction += numberToVarTnt(scriptPubKey.length)
            hexTransaction += bytesToHex(scriptPubKey)
        })

        if(this.isSegwit()) {
            hexTransaction += "00"
            hexTransaction += segwitData
        }

        hexTransaction += numberToHexLE(this.locktime, 32) // locktime

        return hexTransaction
    }

    public getTxid(): string 
    {    
        let hexTransaction = this.build()

        let hash256 = sha256(hexTransaction, true)

        return String(reverseEndian(hash256))
    }

    private generateScriptSig(sigIndex: number, resultType: "hex"|"bytes") : Hex
    { 
        let hexTransaction = String(numberToHexLE(this.version, 32)) // version

        hexTransaction += numberToVarTnt(this.inputs.length) // number of inputs

        this.inputs.forEach((input, index) => {
            hexTransaction += numberToHexLE(input.vout, 32) // index output (vout)
            hexTransaction += reverseEndian(input.txid) // txid
            if(index === sigIndex) {
                const scriptLength = hexToBytes(input.scriptPubKey).length
                hexTransaction += numberToHex(scriptLength, 8)
                hexTransaction += input.scriptPubKey
            } else
                hexTransaction += "00" // length 0x00 to sign
            hexTransaction += "ffffffff" // 0xffffffff
        })

        hexTransaction += numberToVarTnt(this.outputs.length) // number of outputs

        this.outputs.forEach(output => {
            hexTransaction += numberToHexLE(output.amount, 64)
            const scriptPubKey = addressToScriptPubKey(output.address)
            hexTransaction += numberToVarTnt(scriptPubKey.length)
            hexTransaction += bytesToHex(scriptPubKey)
        })

        hexTransaction += String(numberToHexLE(this.locktime, 32)) // locktime

        hexTransaction += numberToHexLE(OP_CODES.SIGHASH_ALL, 32)

        const sigHash = sha256(hexTransaction, true)

        // improve this later
        let signature = this.pairKey.signHash(sigHash) as string

        // add OP_SIGHASH_ALL
        signature += numberToHex(OP_CODES.SIGHASH_ALL, 8)
        const signatureLength = numberToHex(getBytesCount(signature), 8)
        
        const publicKey = this.pairKey.getPublicKey()
        const publicKeyLength = numberToHex(getBytesCount(publicKey), 8)
        
        const scriptSig = signatureLength+signature+publicKeyLength+publicKey
        const scriptSigLength = numberToHex(getBytesCount(scriptSig), 8)

        const result = scriptSigLength+scriptSig

        if(resultType == "hex") return result

        return hexToBytes(result)
    }

    private generateSegWitScriptSig(sigIndex: number, resultType: "hex"|"bytes") : Hex
    {
        console.log("witness scriptSig")
        const currentInput = this.inputs[sigIndex]
        if(!currentInput)
            throw new Error("input not found")

        let hexTransaction = numberToHexLE(this.version, 32) as string // version

        // hashPrevious
        const previous = this.inputs.map(input => {
            let vout = numberToHexLE(input.vout, 32) as string // index output (vout)
            let txid = reverseEndian(input.txid) as string // txid
            return txid+vout
        }).join("")
        const hashPrevious = sha256(previous, true)
        hexTransaction += hashPrevious

        // hashSequence
        const sequence = this.inputs.map(() => "ffffffff").join("")
        const hashSequence = sha256(sequence, true)
        hexTransaction += hashSequence

        // out point 
        let txid = reverseEndian(currentInput.txid) as string
        let vout = numberToHexLE(currentInput.vout, 32) as string
        hexTransaction += txid
        hexTransaction += vout

        // script code
        const pubkeyHash = currentInput.scriptPubKey.substring(4)
        const scriptCode = hash160ToScript(pubkeyHash) as string
        const scriptLength = numberToHex(getBytesCount(scriptCode), 8)
        hexTransaction += scriptLength+scriptCode

        // value
        hexTransaction += numberToHexLE(currentInput.value, 64)

        // sequence
        hexTransaction += "ffffffff"

        // hashOutputs
        const outputs = this.outputs.map(output => {
            const amount = numberToHexLE(output.amount, 64) 
            const scriptPubkey = addressToScriptPubKey(output.address)
            const scriptLength = numberToHex(scriptPubkey.length, 8) as string
            return amount+scriptLength+bytesToHex(scriptPubkey)
        }).join("")
        const hashOutputs = sha256(outputs, true)
        hexTransaction += hashOutputs

        hexTransaction += String(numberToHexLE(this.locktime, 32)) // locktime

        hexTransaction += numberToHexLE(OP_CODES.SIGHASH_ALL, 32) // sighash

        const sigHash = sha256(hexTransaction, true)

        // improve this later
        let signature = this.pairKey.signHash(sigHash) as string

        // add OP_SIGHASH_ALL
        signature += numberToHex(OP_CODES.SIGHASH_ALL, 8)
        const signatureLength = numberToHex(getBytesCount(signature), 8)
        
        const publicKey = this.pairKey.getPublicKey()
        const publicKeyLength = numberToHex(getBytesCount(publicKey), 8)
        
        const scriptSig = signatureLength+signature+publicKeyLength+publicKey
        const scriptSigLength = numberToHex(getBytesCount(scriptSig), 8)

        const result = scriptSigLength+scriptSig

        console.log("witness scriptSig\n", result)

        if(resultType == "hex") return result

        return hexToBytes(result)
    }

    public isSegwit() : boolean {
        return this.inputs.some(this.isSegwitInput)
    }

    private isSegwitInput(input: InputTransaction) 
    {
        const bytes = hexToBytes(input.scriptPubKey)
    
        return ((bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14) || // P2WPKH
            (bytes.length === 34 && bytes[0] == 0x00 && bytes[1] == 0x20))       // P2WSH
    }
    
    public Clear() 
    {
        this.inputs = []
        this.outputs = []
        this.version = 2
    }
}



