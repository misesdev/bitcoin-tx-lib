import { ECPairKey } from "../ecpairkey"
import { InputScript, InputTransaction, OutPutScript, OutputTransaction } from "../types"

export class BTransaction {

    public version: number = 1
    public locktime: number = 0
    public pairKey: ECPairKey
    public inputs: InputTransaction[] = []
    protected inputScripts: InputScript[] = []
    public outputs: OutputTransaction[] = []
    protected outputScripts: OutPutScript[] = []

    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }

    public addInput(input: InputTransaction) {
        this.inputs.push(input)
    }

    public addOutput(output: OutputTransaction) {
        this.outputs.push(output)
    }
}