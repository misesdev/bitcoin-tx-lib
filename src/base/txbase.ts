import { ECPairKey } from "../ecpairkey"
import { InputTransaction, OutputTransaction } from "../types"
import { bytesToHex, getBytesCount, numberToHexLE, numberToVarTnt } from "../utils"
import { Address } from "../utils/address"
import { addressToScriptPubKey } from "../utils/txutils"

export class BaseTransaction {

    public version: number = 2 
    public locktime: number = 0
    public pairKey: ECPairKey
    public cachedata: any = {}
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    
    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }
    
    public addInput(input: InputTransaction) 
    { 
        if(this.inputs.find(i => i.txid == input.txid))
            throw new Error("An input with this txid has already been added")
        if(getBytesCount(input.txid) != 32)
            throw new Error("Expected a valid txid")
        else if(!input.scriptPubKey)
            throw new Error("Expected scriptPubKey")

        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if(!input.sequence)
            input.sequence = "fffffffd"
        
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) 
    {
        if(!Address.isValid(output.address))
            throw new Error("Expected a valid address to output")
        if(output.amount <= 0)
            throw new Error("Expected a valid amount")

        this.outputs.push(output)
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
}


