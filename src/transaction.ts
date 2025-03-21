import { BaseTransaction } from "./base/txbase";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { InputTransaction, OutputTransaction } from "./types/transaction"
import { bytesToHex, getBytesCount, hash256, hexToBytes, numberToHex, numberToHexLE,
    numberToVarTnt, reverseEndian } from "./utils";
import { addressToScriptPubKey, scriptPubkeyToScriptCode } from "./utils/txutils";
import { Hex } from "./types";

interface TXOptions {
    version?: number;
    locktime?: number;
}

export class Transaction extends BaseTransaction {
 
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    private raw?: string = undefined

    constructor(pairkey: ECPairKey, options?: TXOptions) 
    {
        super(pairkey)
        this.version = options?.version ?? 2
        this.locktime = options?.locktime ?? 0
    }

    public addInput(input: InputTransaction) 
    {  
        if(input.txid.length < 10)
            throw new Error("Expected txid value")
        else if(!input.scriptPubKey)
            throw new Error("Expected scriptPubKey")

        if(!input.sequence)
            input.sequence = "ffffffff"
        
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
        let witnessData: string = ""
        
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        if(this.isSegwit()) // Marker and Flag for SegWit transactions
            hexTransaction += bytesToHex(new Uint8Array([0x00, 0x01])) //"00" + "01";

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs
        
        this.inputs.forEach((input, index) => {
            hexTransaction += reverseEndian(input.txid) // txid
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData += String(this.generateWitness(input, "hex"))
                hexTransaction += "00" // script sig in witness area // P2WPKH 
            } else {
                let scriptSig = String(this.generateScriptSig(index, "hex"))
                let scriptSigLength = String(numberToHexLE(getBytesCount(scriptSig), 8, "hex"))
                hexTransaction += scriptSigLength.concat(scriptSig)
                witnessData += "00" // no witness, only scriptSig
            }
            hexTransaction += input.sequence ?? "ffffffff" // 0xffffffff
        })

        hexTransaction += String(numberToVarTnt(this.outputs.length, "hex")) // number of outputs

        this.outputs.forEach(output => {
            hexTransaction += String(numberToHexLE(output.amount, 64, "hex"))
            let scriptPubKey = addressToScriptPubKey(output.address)
            hexTransaction += String(numberToVarTnt(scriptPubKey.length, "hex"))
            hexTransaction += bytesToHex(scriptPubKey)
        })

        if(this.isSegwit()) hexTransaction += witnessData

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        this.raw = hexTransaction

        return hexTransaction
    }

    public getTxid(): string 
    {    
        let hexTransaction = this.raw ?? this.build()

        let hash = hash256(hexTransaction)

        return String(reverseEndian(hash))
    }

    private generateScriptSig(sigIndex: number, resultType: "hex"|"bytes") : Hex
    { 
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs

        this.inputs.forEach((input, index) => {
            hexTransaction += String(reverseEndian(input.txid)) // txid
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)
            if(index === sigIndex) {
                let scriptLength = hexToBytes(input.scriptPubKey).length
                hexTransaction += String(numberToVarTnt(scriptLength, "hex"))
                hexTransaction += input.scriptPubKey
            } else
                hexTransaction += "00" // length 0x00 to sign
            hexTransaction += input.sequence ?? "ffffffff" // 0xffffffff
        })

        hexTransaction += String(numberToVarTnt(this.outputs.length, "hex")) // number of outputs

        this.outputs.forEach(output => {
            hexTransaction += String(numberToHexLE(output.amount, 64, "hex"))
            let scriptPubKey = addressToScriptPubKey(output.address)
            hexTransaction += String(numberToVarTnt(scriptPubKey.length, "hex"))
            hexTransaction += bytesToHex(scriptPubKey)
        })

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex"))

        let sigHash = String(hash256(hexTransaction)) // hash256 -> sha256(sha256(content))

        // improve this later
        let signature = String(this.pairKey.signDER(sigHash)) 

        // add OP_SIGHASH_ALL
        signature += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 8, "hex"))

        let signatureLength = String(numberToHex(getBytesCount(signature), 8, "hex"))
        
        let publicKey = this.pairKey.getPublicKeyCompressed("hex")
        let publicKeyLength = String(numberToHex(getBytesCount(publicKey), 8, "hex"))
        
        let scriptSig = signatureLength.concat(signature, publicKeyLength, publicKey)

        if(resultType == "hex") return scriptSig

        return hexToBytes(scriptSig)
    }

    private generateWitness(input: InputTransaction, resultType: "hex"|"bytes") : Hex
    {
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version
        // hashPrevouts
        let prevouts = this.inputs.map(input => {
            let vout = String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)
            let txid = String(reverseEndian(input.txid)) // txid
            return txid.concat(vout)
        }).join("")
        let hashPrevouts = hash256(prevouts)
        hexTransaction += hashPrevouts
        // hashSequence
        let sequence = this.inputs.map(input => input.sequence ?? "ffffffff").join("")
        let hashSequence = hash256(sequence)
        hexTransaction += hashSequence
        // out point 
        hexTransaction = String(reverseEndian(input.txid))
        hexTransaction = String(numberToHexLE(input.vout, 32, "hex"))
        // script code
        let scriptCode = scriptPubkeyToScriptCode(input.scriptPubKey)
        hexTransaction += scriptCode
        // amount
        hexTransaction += String(numberToHexLE(input.value, 64, "hex"))
        // sequence
        hexTransaction += input.sequence ?? "ffffffff"
        // hashOutputs
        let outputs = this.outputs.map(output => {
            let amount = String(numberToHexLE(output.amount, 64, "hex")) 
            let scriptPubkey = addressToScriptPubKey(output.address)
            let scriptLength = String(numberToVarTnt(scriptPubkey.length, "hex"))
            return amount.concat(scriptLength, bytesToHex(scriptPubkey))
        }).join("")
        let hashOutputs = hash256(outputs)
        hexTransaction += hashOutputs

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex")) // sighash

        let sigHash = String(hash256(hexTransaction))  // hash256 -> sha256(sha256(content))

        let signature = String(this.pairKey.signDER(sigHash))

        signature += String(numberToHex(OP_CODES.SIGHASH_ALL, 8, "hex"))
        
        let signatureLength = String(numberToVarTnt(getBytesCount(signature), "hex"))
       
        let publicKey = this.pairKey.getPublicKeyCompressed("hex")
        let publicKeyLength = String(numberToVarTnt(getBytesCount(publicKey), "hex"))

        let itemCount = String(numberToHex(2, 8, "hex")) // 2 items(signature & pubkey) 0x02
        
        let scriptSig = itemCount.concat(signatureLength, signature, publicKeyLength, publicKey)

        if(resultType == "hex") return scriptSig

        return hexToBytes(scriptSig)
    }

    public isSegwit() : boolean {
        return this.inputs.some(this.isSegwitInput)
    }

    private isSegwitInput(input: InputTransaction) : boolean 
    {
        const bytes = hexToBytes(input.scriptPubKey)
    
        return ((bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14) || // P2WPKH
            (bytes.length === 34 && bytes[0] == 0x00 && bytes[1] == 0x20))       // P2WSH
    }
    
    public clear() 
    {
        this.inputs = []
        this.outputs = []
        this.version = 2
    }
}



