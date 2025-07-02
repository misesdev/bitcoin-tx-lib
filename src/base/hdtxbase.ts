import { ECPairKey } from "../ecpairkey"
import { InputTransaction, OutputTransaction, TXOptions } from "../types"
import { getBytesCount, numberToHexLE, numberToVarint } from "../utils"
import { Address } from "../utils/address"
import { ByteBuffer } from "../utils/buffer"
import { addressToScriptPubKey } from "../utils/txutils"

export abstract class HDTransactionBase 
{
    public version: number = 2 
    public locktime: number = 0
    protected inputs: InputTransaction[] = []
    protected outputs: OutputTransaction[] =[]
    protected pairKeys: Map<string, ECPairKey>
    protected whoPayTheFee?: string
    protected fee?: number

    constructor(options?: TXOptions)
    {
        this.pairKeys = new Map()
        this.version = options?.version ?? 2
        this.locktime = options?.locktime ?? 0
        this.whoPayTheFee = options?.whoPayTheFee
        this.fee = options?.fee
    }

    public addInput(input: InputTransaction, pairkey: ECPairKey) 
    { 
        if(getBytesCount(input.txid) != 32)
            throw new Error("Expected a valid txid")
        else if(!input.scriptPubKey)
            throw new Error("Expected scriptPubKey")
        if(this.inputs.some(i => i.txid == input.txid))
            throw new Error("An input with this txid has already been added")

        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if(!input.sequence) input.sequence = "fffffffd"

        this.pairKeys.set(input.txid, pairkey)
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) 
    {
        if(output.amount <= 0)
            throw new Error("Expected a valid amount")
        if(!Address.isValid(output.address))
            throw new Error("Expected a valid address to output")
        if(this.outputs.some(o => o.address == output.address))
            throw new Error("An output with this address has already been added")

        this.outputs.push(output)
    }

    public outputsRaw() : Uint8Array {
        const rows = this.outputs.map(output => {
            let txoutput = new ByteBuffer(numberToHexLE(output.amount, 64))
            let scriptPubKey = addressToScriptPubKey(output.address)
            txoutput.append(numberToVarint(scriptPubKey.length))
            txoutput.append(scriptPubKey)
            return txoutput.raw()
        }).flat()
        return ByteBuffer.merge(rows)
    }
}
