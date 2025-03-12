import { Base58 } from "./base/base58";
import { Bech32 } from "./base/bech32";
import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { BNetwork, InputScript, OutPutScript } from "./types";
import { InputTransaction, OutputTransaction } from "./types/transaction"
import { hexToBytes, mergeUint8Arrays, numberToHex, numberToHexLE, reverseEndian, sha256 } from "./utils";

export class Transaction extends BaseTransaction {
 
    public inputs: InputTransaction[] = []
    public outputs: OutputTransaction[] =[]
    private inputScripts: InputScript[] = []
    private outputScripts: OutPutScript[] = []
    private network: BNetwork = "mainnet"

    constructor(pairkey: ECPairKey) {
        super(pairkey)
        this.version = 2
        this.network = "mainnet"
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

    public addressToScriptPubKey(address: string): Uint8Array {
        if(["1", "m", "n"].includes(address[0])) {
            // P2PKH Legacy
            const decoded = hexToBytes(Base58.decode(address))
            const hash = decoded.slice(1, -4) // remove the prefix and checksum
            return mergeUint8Arrays(hexToBytes("76a914"), hash, hexToBytes("88ac"))
        } else if (["2", "3"].includes(address[0])) {
            // P2SH Legacy
            const decoded = hexToBytes(Base58.decode(address))
            const hash = decoded.slice(1, -4) // remove the prefix and checksum
            return mergeUint8Arrays(hexToBytes("a914"), hash, hexToBytes("87"))
        } else if (["tb1", "bc1"].includes(address.substring(0,2))) {
            // SegWit (P2WPKH, P2WSH)
            const decoder = new Bech32({ 
                publicKey: this.pairKey.getPublicKey(), 
                network: this.network
            })
            const hash = decoder.decode(address)
            if(hash) {
                const prefixScript = new Uint8Array([0x00, hash.length])
                return mergeUint8Arrays(prefixScript, hash)
            }
            throw new Error("Invalid bech32 format address")
        }
        throw new Error("not supported format address")
    }

    public isSegwit() : boolean {
        return this.inputs.some(input => { 
            const bytes = hexToBytes(input.scriptPubKey)
            return bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14
        })
    }
}



