import { BaseTransaction } from "./base/txbase";
import { OP_CODES } from "./constants/opcodes";
import { ECPairKey } from "./ecpairkey";
import { bytesToHex, getBytesCount, hash256, hexToBytes, numberToHex, numberToHexLE,
    numberToVarTnt, reverseEndian } from "./utils";
import { scriptPubkeyToScriptCode } from "./utils/txutils";
import { Hex, InputTransaction } from "./types";

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

    public build(format: BuildFormat = "raw"): string 
    {    
        let witnessData: string = ""
        
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        if(this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction += bytesToHex(new Uint8Array([0x00, 0x01])) //"00" + "01";

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs
        
        this.inputs.forEach(input => {
            hexTransaction += reverseEndian(input.txid) // txid
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData += String(this.generateWitness(input, "hex"))
                hexTransaction += "00" // script sig in witness area // P2WPKH 
            } else {
                let scriptSig = String(this.generateScriptSig(input, "hex"))
                let scriptSigLength = String(numberToHexLE(getBytesCount(scriptSig), 8, "hex"))
                hexTransaction += scriptSigLength.concat(scriptSig)
                witnessData += "00" // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction += input.sequence ?? reverseEndian("fffffffd") // 0xfffffffd
        })

        hexTransaction += String(numberToVarTnt(this.outputs.length, "hex")) // number of outputs

        hexTransaction += this.outputsRaw() // amount+scriptpubkey

        if(this.isSegwit() && format != "txid") hexTransaction += witnessData

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        return hexTransaction
    }

    public getTxid(): string 
    {    
        let hexTransaction = this.build("txid")
        
        let hash = String(hash256(hexTransaction))

        return String(reverseEndian(hash))
    }

    private generateScriptSig(inputSig: InputTransaction, resultType: "hex"|"bytes") : Hex
    {
        let hexTransaction = String(numberToHexLE(this.version, 32, "hex")) // version

        hexTransaction += String(numberToVarTnt(this.inputs.length, "hex")) // number of inputs

        this.inputs.forEach(input => {
            hexTransaction += String(reverseEndian(input.txid)) // txid
            hexTransaction += String(numberToHexLE(input.vout, 32, "hex")) // index output (vout)
            if(input.txid === inputSig.txid) {
                let scriptLength = hexToBytes(input.scriptPubKey).length
                hexTransaction += String(numberToVarTnt(scriptLength, "hex"))
                hexTransaction += input.scriptPubKey
            } else
                hexTransaction += "00" // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction += input.sequence ?? reverseEndian("fffffffd") 
        })

        hexTransaction += String(numberToVarTnt(this.outputs.length, "hex")) // number of outputs

        hexTransaction += this.outputsRaw()

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex"))

        let sigHash = String(hash256(hexTransaction)) // hash256 -> sha256(sha256(content))

        let signature = bytesToHex(this.pairKey.signDER(hexToBytes(sigHash))) 

        signature += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 8, "hex"))

        let signatureLength = String(numberToHex(getBytesCount(signature), 8, "hex"))
        
        let publicKey = bytesToHex(this.pairKey.getPublicKey())
        let publicKeyLength = String(numberToHex(getBytesCount(publicKey), 8, "hex"))
        
        let scriptSig = signatureLength.concat(signature, publicKeyLength, publicKey)

        if(resultType == "hex") return scriptSig
        
        return hexToBytes(scriptSig)
    }

    private generateWitness(input: InputTransaction, resultType: "hex"|"bytes" = "hex") : Hex
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
        let sequence = this.inputs.map(input => input.sequence ?? reverseEndian("fffffffd")).join("")
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
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        hexTransaction += input.sequence ?? reverseEndian("fffffffd")
        // hashOutputs
        let hashOutputs = hash256(this.outputsRaw())
        hexTransaction += hashOutputs

        hexTransaction += String(numberToHexLE(this.locktime, 32, "hex")) // locktime

        hexTransaction += String(numberToHexLE(OP_CODES.SIGHASH_ALL, 32, "hex")) // sighash

        let sigHash = String(hash256(hexTransaction))  // hash256 -> sha256(sha256(content))

        let signature = bytesToHex(this.pairKey.signDER(hexToBytes(sigHash)))

        signature += String(numberToHex(OP_CODES.SIGHASH_ALL, 8, "hex"))
        
        let signatureLength = String(numberToVarTnt(getBytesCount(signature), "hex"))
       
        let publicKey = bytesToHex(this.pairKey.getPublicKey())
        
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
    
    // docs https://learnmeabitcoin.com/technical/transaction/size/
    public weight() : number {
	    // witness marker and flag * 1
        let witnessMK = 0 // 2 bytes of marker and flag 0x00+0x01 = 2 bytes * 1
       
        if(this.isSegwit()) witnessMK = 2

        let hexTransaction = this.build()
        
        let witnessInputs = this.inputs.filter(this.isSegwitInput)
	    // witness size * 1
        let witnessSize = witnessInputs.reduce((sum, input) => {
            let witness = String(this.generateWitness(input))
            return sum + getBytesCount(witness)
        }, 0) 
        // discount the size of the witness fields and multiply by 4
        let transactionSize = getBytesCount(hexTransaction)
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



