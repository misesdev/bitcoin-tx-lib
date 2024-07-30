import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { InputScript, InputTransaction, OutPutScript, OutputTransaction } from "./types";
import { bytesToHex, hexToBytes, numberToHex, numberToHexLE, reverseEndian, sha256 } from "./utils";

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
}


