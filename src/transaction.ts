import { Base58 } from "./base/base58";
import { BaseTransaction } from "./base/txbase";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { BNetwork, Hex } from "./types";
import { InputTransaction, OutputTransaction } from "./types/transaction"
import { bytesToHex, getBytesCount, hash160ToScript, hexToBytes, 
    numberToHex, numberToHexLE, numberToVarTnt, reverseEndian, 
    ripemd160, 
    sha256 } from "./utils";
import { addressToScriptPubKey } from "./utils/txutils";

interface TXOptions {
    version?: number;
    network: BNetwork;
}

export class Transaction extends BaseTransaction {
 
    private network: BNetwork = "mainnet"
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    private transactionRow?: string = undefined

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
        let witnessCount: number = 0
        
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        if(this.isSegwit()) // Marker e Flag for SegWit transactions
            hexTransaction += bytesToHex(new Uint8Array([0x00, 0x01])) //"00" + "01";

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs
        
        this.inputs.forEach((input, index) => {
            hexTransaction += reverseEndian(input.txid) // txid
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData += String(this.generateSegWitScriptSig(input, "hex"))
                hexTransaction += "00" // script sig in witness area // P2WPKH 
                witnessCount++
            } else {
                let scriptSig = String(this.generateScriptSig(index, "hex"))
                let scriptSigLength = String(numberToHexLE(getBytesCount(scriptSig), 8, "hex"))
                hexTransaction += scriptSigLength.concat(scriptSig)
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

        if(this.isSegwit()) {
            // hexTransaction += String(numberToHex(witnessCount, 8, "hex"))
            hexTransaction += witnessData
        }

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        this.transactionRow = hexTransaction

        return hexTransaction
    }

    public getTxid(): string 
    {    
        let hexTransaction = this.transactionRow ?? this.build()

        let hash256 = sha256(hexTransaction, true)

        return String(reverseEndian(hash256))
    }

    private generateScriptSig(sigIndex: number, resultType: "hex"|"bytes") : Hex
    { 
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs

        this.inputs.forEach((input, index) => {
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)
            hexTransaction += String(reverseEndian(input.txid)) // txid
            if(index === sigIndex) {
                let scriptLength = hexToBytes(input.scriptPubKey).length
                hexTransaction += String(numberToHex(scriptLength, 8, "hex"))
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

        let sigHash = sha256(hexTransaction, true) // hash256 -> sha256(sha256(content))

        // improve this later
        let signature = this.pairKey.signHash(sigHash) as string

        // add OP_SIGHASH_ALL
        signature += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 8, "hex"))

        let signatureLength = String(numberToHex(getBytesCount(signature), 8, "hex"))
        
        let publicKey = Base58.decode(this.pairKey.getPublicKeyCompressed())
        let publicKeyLength = String(numberToHex(getBytesCount(publicKey), 8, "hex"))
        
        let scriptSig = signatureLength.concat(signature, publicKeyLength, publicKey)

        if(resultType == "hex") return scriptSig

        return hexToBytes(scriptSig)
    }

    private generateSegWitScriptSig(currentInput: InputTransaction, resultType: "hex"|"bytes") : Hex
    {
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        // hashPrevious
        let previous = this.inputs.map(input => {
            let vout = String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)
            let txid = String(reverseEndian(input.txid)) // txid
            return txid.concat(vout)
        }).join("")

        let hashPrevious = sha256(previous, true)
        hexTransaction += hashPrevious

        // hashSequence
        let sequence = this.inputs.map(input => input.sequence ?? "ffffffff").join("")
        let hashSequence = sha256(sequence, true)
        hexTransaction += hashSequence

        // out point 
        hexTransaction = String(reverseEndian(currentInput.txid))
        hexTransaction = String(numberToHexLE(currentInput.vout, 32, "hex"))

        // script code
        let pubkeyHash = currentInput.scriptPubKey.substring(4)
        let scriptCode = "1976a914".concat(pubkeyHash, "88ac") 
        hexTransaction += scriptCode

        // amount
        hexTransaction += String(numberToHexLE(currentInput.value, 64, "hex"))

        // sequence
        hexTransaction += currentInput.sequence ?? "ffffffff"

        // hashOutputs
        let outputs = this.outputs.map(output => {
            let amount = String(numberToHexLE(output.amount, 64, "hex")) 
            let scriptPubkey = addressToScriptPubKey(output.address)
            let scriptLength = String(numberToHex(scriptPubkey.length, 8, "hex"))
            return amount.concat(scriptLength, bytesToHex(scriptPubkey))
        }).join("")
        let hashOutputs = sha256(outputs, true)
        hexTransaction += hashOutputs

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex")) // sighash

        let sigHash = String(sha256(hexTransaction, true))  // hash256 -> sha256(sha256(content))

        let signature = String(this.pairKey.sign(sigHash))
        console.log("signature", signature)
        // add OP_SIGHASH_ALL
        signature += String(numberToHex(OP_CODES.SIGHASH_ALL, 8, "hex"))
        let signatureLength = String(numberToHex(getBytesCount(signature), 8, "hex"))
        
        let publicKey = Base58.decode(this.pairKey.getPublicKeyCompressed())
        let publicKeyLength = String(numberToHex(getBytesCount(publicKey), 8, "hex"))

        let itemCount = String(numberToHex(2, 8, "hex")) // 2 items(signature & pubkey) 0x02
        
        let scriptSig = itemCount.concat(signatureLength, signature, publicKeyLength, publicKey)

        if(resultType == "hex") return scriptSig

        return hexToBytes(scriptSig)
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



