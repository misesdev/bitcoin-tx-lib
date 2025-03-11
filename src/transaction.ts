import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { InputScript, OutPutScript } from "./types";
import { InputTransaction, OutputTransaction } from "./types/transaction"
import { hexToBytes, numberToHex, numberToHexLE, reverseEndian, sha256 } from "./utils";

export class Transaction extends BaseTransaction {
  
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    private inputScripts: InputScript[] = []
    private outputScripts: OutPutScript[] = []

    constructor(pairkey: ECPairKey) {
        super(pairkey)
        this.version = 2
    }

    public addInput(input: InputTransaction) {
  
        if(input.txid.length < 10)
            throw new Error("Expected txid value")
        else if(!input.scriptPubKey)
            throw new Error("Expected scriptPubKey")
        
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) {

        if(output.address.length <= 10)
            throw new Error("Expected address value!")
        this.outputs.push(output)
    }

    public build(): string {
        let hexTransaction = String(numberToHexLE(this.version, 32))

        hexTransaction += ""

        return hexTransaction
    }

    public buildRow(): string {
        let hexTransaction = String(numberToHexLE(this.version, 32))
    
        hexTransaction += ""

        return hexTransaction
    }

    public buildToSign(): string {
        let hexTransaction = String(numberToHexLE(this.version, 32))

        hexTransaction += String(numberToHex(this.inputs.length, 8)) 

        hexTransaction += this.inputScripts.map(input => {
            return input.hexTxid + input.hexTxindex + input.hexSequence
        }).join("")

        hexTransaction += String(numberToHex(this.outputs.length, 8))

        hexTransaction += this.outputScripts.map(output => {
            return output.hexScriptLength + output.hexScript + output.hexValue
        }).join("")

        hexTransaction += String(numberToHexLE(this.locktime, 32))

        return hexTransaction
    }  

    public getTxid(): string {
    
        let hexTransaction = this.build()

        let hash256 = sha256(hexTransaction, true)

        return String(reverseEndian(hash256))
    }

    public isSegwit() : boolean {
        return this.inputs.some(input => { 
            const bytes = hexToBytes(input.scriptPubKey)
            return bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14
        })
    }


}



