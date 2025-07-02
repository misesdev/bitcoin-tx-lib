import { BaseTransaction } from "./base/txbase";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { bytesToHex, hash256, hexToBytes, numberToHex, numberToHexLE,
    numberToVarTnt } from "./utils";
import { scriptPubkeyToScriptCode } from "./utils/txutils";
import { InputTransaction } from "./types";
import { ByteBuffer } from "./utils/buffer";

type BuildFormat = "raw" | "txid"

interface TXOptions {
    version?: number;
    locktime?: number;
    whoPayTheFee?: string;
    fee?: number;
}

export class Transaction extends BaseTransaction {

    constructor(pairkey: ECPairKey, options?: TXOptions) 
    {
        super(pairkey)
        this.version = options?.version ?? 2
        this.locktime = options?.locktime ?? 0
        this.whoPayTheFee = options?.whoPayTheFee
        this.fee = options?.fee
    }

    public getFeeSats() {
        return Math.ceil(this.vBytes() * (this.fee??1))
    }

    public resolveFee() : void
    {
        let satoshis = Math.ceil(this.vBytes() * (this.fee??1))

        if(this.outputs.length == 1) {
            this.outputs[0].amount -= satoshis
            return
        }
        
        if(this.whoPayTheFee === "everyone") {
            satoshis = Math.ceil(this.vBytes() * (this.fee??1) / this.outputs.length)
            this.outputs.forEach(out => out.amount -= satoshis)
        }

        for(let i = 0; i < this.outputs.length; i++) {
            if(this.outputs[i].address == this.whoPayTheFee) {
                this.outputs[i].amount -= satoshis
                break
            }
        }
    }

    public build(format: BuildFormat = "raw"): Uint8Array 
    {    
        let witnessData = new ByteBuffer()
        
        let hexTransaction = new ByteBuffer(numberToHexLE(this.version, 32)) // version

        if(this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])) //"00" + "01";

        // number of inputs
        hexTransaction.append(numberToVarTnt(this.inputs.length))
        
        this.inputs.forEach(input => {
            hexTransaction.append(hexToBytes(input.txid).reverse()) // txid
            hexTransaction.append(numberToHexLE(input.vout, 32)) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData.append(this.generateWitness(input))
                hexTransaction.append(new Uint8Array([0])) // script sig in witness area // P2WPKH 
            } else {
                let scriptSig = this.generateScriptSig(input)
                hexTransaction.append(numberToHexLE(scriptSig.length, 8))
                hexTransaction.append(scriptSig)
                witnessData.append(new Uint8Array([0])) // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse()) // 0xfffffffd
        })

        hexTransaction.append(numberToVarTnt(this.outputs.length)) // number of outputs

        hexTransaction.append(this.outputsRaw()) // amount+scriptpubkey

        if(this.isSegwit() && format != "txid") hexTransaction.append(witnessData.raw())

        hexTransaction.append(numberToHexLE(this.locktime, 32)) // locktime

        return hexTransaction.raw()
    }

    public getTxid(): string 
    {    
        let hexTransaction = this.build("txid")
        
        let txid = hash256(hexTransaction).reverse()

        return bytesToHex(txid)
    }

    private generateScriptSig(inputSig: InputTransaction) : Uint8Array
    {
        let hexTransaction = new ByteBuffer(numberToHexLE(this.version, 32)) // version

        hexTransaction.append(numberToVarTnt(this.inputs.length)) // number of inputs

        this.inputs.forEach(input => {
            hexTransaction.append(hexToBytes(input.txid).reverse()) // txid
            hexTransaction.append(numberToHexLE(input.vout, 32)) // index output (vout)
            if(input.txid === inputSig.txid) {
                let script = hexToBytes(input.scriptPubKey)
                hexTransaction.append(numberToVarTnt(script.length))
                hexTransaction.append(script)
            } else
                hexTransaction.append(new Uint8Array([0])) // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse()) 
        })

        hexTransaction.append(numberToVarTnt(this.outputs.length)) // number of outputs

        hexTransaction.append(this.outputsRaw())

        hexTransaction.append(numberToHexLE(this.locktime, 32)) // locktime

        hexTransaction.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 32))

        let sigHash = hash256(hexTransaction.raw()) // hash256 -> sha256(sha256(content))

        let scriptSig = new ByteBuffer(this.pairKey.signDER(sigHash))

        scriptSig.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 8)) 

        scriptSig.prepend(numberToHex(scriptSig.length, 8))
        
        let publicKey = this.pairKey.getPublicKey()

        scriptSig.append(numberToHex(publicKey.length, 8))
        scriptSig.append(publicKey)
        
        return scriptSig.raw()
    }

    private generateWitness(input: InputTransaction) : Uint8Array 
    {
        let hexTransaction = new ByteBuffer(numberToHexLE(this.version, 32)) // version
        // hashPrevouts
        let prevouts = this.inputs.map(input => {
            let build = new ByteBuffer(hexToBytes(input.txid).reverse())
            build.append(numberToHexLE(input.vout, 32))
            return build.raw()
        })
        let hashPrevouts = hash256(ByteBuffer.merge(prevouts))
        hexTransaction.append(hashPrevouts)
        // hashSequence
        let sequence = this.inputs.map(input => hexToBytes(input.sequence??"fffffffd").reverse())
        let hashSequence = hash256(ByteBuffer.merge(sequence))
        hexTransaction.append(hashSequence)
        // out point 
        hexTransaction.append(hexToBytes(input.txid).reverse())
        hexTransaction.append(numberToHexLE(input.vout, 32))
        // script code
        let scriptCode = scriptPubkeyToScriptCode(input.scriptPubKey)
        hexTransaction.append(scriptCode)
        // amount
        hexTransaction.append(numberToHexLE(input.value, 64))
        // sequence
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse())
        // hashOutputs
        let hashOutputs = hash256(this.outputsRaw())
        hexTransaction.append(hashOutputs)

        hexTransaction.append(numberToHexLE(this.locktime, 32)) // locktime

        hexTransaction.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 32)) // sighash

        let sigHash = hash256(hexTransaction.raw())  // hash256 -> sha256(sha256(content))

        let scriptSig = new ByteBuffer(this.pairKey.signDER(sigHash))

        scriptSig.append(numberToHex(OP_CODES.SIGHASH_ALL, 8))
        
        scriptSig.prepend(numberToVarTnt(scriptSig.length))
       
        let publicKey = this.pairKey.getPublicKey()
        scriptSig.append(numberToVarTnt(publicKey.length))
        scriptSig.append(publicKey)

        scriptSig.prepend(numberToHex(2, 8)) // 2 items(signature & pubkey) 0x02
        
        return scriptSig.raw()
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
    
    // docs https://learnmeabitcoin.com/technical/transaction/size/
    public weight() : number {
	    // witness marker and flag * 1
        let witnessMK = 0 // 2 bytes of marker and flag 0x00+0x01 = 2 bytes * 1
       
        if(this.isSegwit()) witnessMK = 2

        let hexTransaction = this.build()
        
        let witnessInputs = this.inputs.filter(this.isSegwitInput)
	    // witness size * 1
        let witnessSize = witnessInputs.reduce((sum, input) => {
            let witness = this.generateWitness(input)
            return sum + witness.length
        }, 0) 
        // discount the size of the witness fields and multiply by 4
        let transactionSize = hexTransaction.length
        transactionSize = (transactionSize - (witnessSize + witnessMK)) * 4 
        transactionSize += (witnessSize + witnessMK) // * 1
        
        return Math.ceil(transactionSize)
    }

    // docs https://learnmeabitcoin.com/technical/transaction/size/
    public vBytes() {
       	return Math.ceil(this.weight() / 4) 
    }
    
    public clear() 
    {
        this.inputs = []
        this.outputs = []
    }
}



