import { ECPairKey } from "../ecpairkey"
import { InputTransaction, OutputTransaction } from "../types"
import { bytesToHex, getBytesCount, numberToHexLE, numberToVarTnt } from "../utils"
import { Address } from "../utils/address"
import { addressToScriptPubKey } from "../utils/txutils"

export abstract class BaseTransaction {

    public version: number = 2 
    public locktime: number = 0
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    protected fee?: number
    protected whoPayTheFee?: string
    protected cachedata: any = {}
    protected pairKey: ECPairKey
    
    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }
    
    public addInput(input: InputTransaction) 
    { 
        if(this.inputs.some(i => i.txid == input.txid))
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
        if(this.outputs.some(o => o.address == output.address))
            throw new Error("An output with this address has already been added")
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


