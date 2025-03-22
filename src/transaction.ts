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

        hexTransaction += this.outputsRaw() // amount+scriptpubkey

        if(this.isSegwit()) hexTransaction += witnessData

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        this.raw = hexTransaction

        return hexTransaction
    }

    public outputsRaw() : string {
        return this.outputs.map(output => {
            let txoutput = String(numberToHexLE(output.amount, 64, "hex"))
            let scriptPubKey = addressToScriptPubKey(output.address)
            txoutput += String(numberToVarTnt(scriptPubKey.length, "hex"))
            txoutput += bytesToHex(scriptPubKey)
            return txoutput
        }).join("")
    }

    public getTxid(): string 
    {    
        let hexTransaction = "02000000000102d6986bb800ba475f4de8fd2c9e96061150869ecf9119bc800848e03abb41d0900000000000ffffffff8d9b4613f310ec6f0324ab2dba4494236caacbb2d63a77e54063860b30b8de7f0000000000ffffffff01095e0000000000001976a914b334e6ed7bfc6a782eff6ecfe55c8abc10baaea388ac0247304402207bb407a44f00b2b0cb8e47656f30208c6d016a38284d1a028cfceaca86cd3d4a02201f999fd40aaec0bddc20efe6fae948a15e6e4ba6cf6c2d5cf4c3beb16d8ada4101210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f0247304402206a1ad54a626df76c95a72761013f880d4120250e2cf8e3826cb6a6495dd0125a022012aa53b47113357f03517dc8f2c5f3cbffec357109d8b61be257a090eb6c46cf01210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f00000000"
        //this.raw ?? this.build()
        
        let hash = String(hash256(hexTransaction))

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

        hexTransaction += this.outputsRaw()

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex"))

        let sigHash = String(hash256(hexTransaction)) // hash256 -> sha256(sha256(content))

        let signature = String(this.pairKey.signDER(sigHash)) 

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
        hexTransaction += String(reverseEndian(input.txid))
        hexTransaction += String(numberToHexLE(input.vout, 32, "hex"))
        // script code
        let scriptCode = scriptPubkeyToScriptCode(input.scriptPubKey)
        hexTransaction += scriptCode
        // amount
        hexTransaction += String(numberToHexLE(input.value, 64, "hex"))
        // sequence
        hexTransaction += input.sequence ?? "ffffffff"
        // hashOutputs
        let hashOutputs = hash256(this.outputsRaw())
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



