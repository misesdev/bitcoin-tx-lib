import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputTransaction, OutPutScript, OutputTransaction } from "./types";

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
    this.inputs.push(input)
  }

  public addOutput(output: OutputTransaction) {
    this.outputs.push(output)
  }

  public build() {

  }

  public getTxid() {

  }
}


