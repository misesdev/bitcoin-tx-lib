import { OP_CODES } from "../constants/opcodes";
import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction } from "../types"
import { getBytesCount, hash256, hexToBytes, numberToHex, numberToHexLE, numberToVarint } from "../utils"
import { Address } from "../utils/address";
import { ByteBuffer } from "../utils/buffer";
import { addressToScriptPubKey, scriptPubkeyToScriptCode } from "../utils/txutils";

export type BuildFormat = "raw" | "txid";

export interface SigParams {
    inputs: InputTransaction[];
    outputs: OutputTransaction[];
    pairkey: ECPairKey;
    locktime: number;
    version: number;
}

/**
 * Base class for building and signing Bitcoin transactions (both Legacy and SegWit).
 */
export abstract class TransactionBuilder 
{
    /**
     * Determines if any input is a SegWit (P2WPKH or P2WSH) input.
     * @param inputs List of transaction inputs.
     * @returns True if at least one input is SegWit.
     */
    public isSegwit(inputs: InputTransaction[]) : boolean 
    {
        return inputs.some(this.isSegwitInput)
    }

    /**
     * Checks if a specific input is a SegWit input (P2WPKH or P2WSH).
     * @param input The input to check.
     * @returns True if input is SegWit.
     */
    public isSegwitInput(input: InputTransaction) : boolean 
    {
        const bytes = hexToBytes(input.scriptPubKey as string)
    
        return ((bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14) || // P2WPKH
            (bytes.length === 34 && bytes[0] == 0x00 && bytes[1] == 0x20))       // P2WSH
    }

    /**
     * Builds and signs the entire transaction.
     * @param params Signing parameters including inputs, outputs, key, version and locktime.
     * @param format Whether to generate a "raw" or "txid" version.
     * @returns Raw transaction bytes.
     */
    protected buildAndSign(params: SigParams, format: BuildFormat = "raw"): Uint8Array 
    {    
        let witnessData = new ByteBuffer()
        
        let hexTransaction = new ByteBuffer(numberToHexLE(params.version, 32)) // version

        if(this.isSegwit(params.inputs) && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])) //"00" + "01";

        // number of inputs
        hexTransaction.append(numberToVarint(params.inputs.length))
        
        params.inputs.forEach(input => {
            hexTransaction.append(hexToBytes(input.txid).reverse()) // txid
            hexTransaction.append(numberToHexLE(input.vout, 32)) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData.append(this.generateWitness(input, params))
                hexTransaction.append(new Uint8Array([0])) // script sig in witness area // P2WPKH 
            } else {
                witnessData.append(new Uint8Array([0])) // no witness, only scriptSig
                let scriptSig = this.generateScriptSig(input, params)
                hexTransaction.append(numberToVarint(scriptSig.length))
                hexTransaction.append(scriptSig)
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse()) // 0xfffffffd
        })

        hexTransaction.append(numberToVarint(params.outputs.length)) // number of outputs

        hexTransaction.append(this.outputsRaw(params.outputs)) // amount+scriptpubkey

        if(this.isSegwit(params.inputs) && format != "txid") hexTransaction.append(witnessData.raw())

        hexTransaction.append(numberToHexLE(params.locktime, 32)) // locktime

        return hexTransaction.raw()
    }

    /**
     * Generates the `scriptSig` for a legacy (non-SegWit) P2PKH input.
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The generated `scriptSig` as a byte array.
     */
    protected generateScriptSig(input: InputTransaction, { 
        inputs, outputs, pairkey, locktime, version }: SigParams) : Uint8Array
    {
        let hexTransaction = new ByteBuffer(numberToHexLE(version, 32)) // version

        hexTransaction.append(numberToVarint(inputs.length)) // number of inputs

        inputs.forEach(txin => {
            hexTransaction.append(hexToBytes(txin.txid).reverse()) // txid
            hexTransaction.append(numberToHexLE(txin.vout, 32)) // index output (vout)
            if(txin.txid === input.txid) {
                let script = hexToBytes(txin.scriptPubKey as string)
                hexTransaction.append(numberToVarint(script.length))
                hexTransaction.append(script)
            } else
                hexTransaction.append(new Uint8Array([0])) // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse()) 
        })

        hexTransaction.append(numberToVarint(outputs.length)) // number of outputs

        hexTransaction.append(this.outputsRaw(outputs))

        hexTransaction.append(numberToHexLE(locktime, 32)) // locktime

        hexTransaction.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 32))

        let sigHash = hash256(hexTransaction.raw()) // hash256 -> sha256(sha256(content))

        let scriptSig = new ByteBuffer(pairkey.signDER(sigHash))

        scriptSig.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 8)) 

        scriptSig.prepend(numberToHex(scriptSig.length, 8))
        
        let publicKey = pairkey.getPublicKey()

        scriptSig.append(numberToHex(publicKey.length, 8))
        scriptSig.append(publicKey)
        
        return scriptSig.raw()
    }

    /**
     * Generates the witness data for a SegWit input (P2WPKH).
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The witness field as a byte array.
     */
    protected generateWitness(input: InputTransaction, { 
        inputs, outputs, pairkey, locktime, version }: SigParams) : Uint8Array 
    {
        let hexTransaction = new ByteBuffer(numberToHexLE(version, 32)) // version
        // hashPrevouts
        let prevouts = inputs.map(input => {
            let build = new ByteBuffer(hexToBytes(input.txid).reverse())
            build.append(numberToHexLE(input.vout, 32))
            return build.raw()
        })
        let hashPrevouts = hash256(ByteBuffer.merge(prevouts))
        hexTransaction.append(hashPrevouts)
        // hashSequence
        let sequence = inputs.map(input => hexToBytes(input.sequence??"fffffffd").reverse())
        let hashSequence = hash256(ByteBuffer.merge(sequence))
        hexTransaction.append(hashSequence)
        // out point 
        hexTransaction.append(hexToBytes(input.txid).reverse())
        hexTransaction.append(numberToHexLE(input.vout, 32))
        // script code
        let scriptCode = scriptPubkeyToScriptCode(input.scriptPubKey as string)
        hexTransaction.append(scriptCode)
        // amount
        hexTransaction.append(numberToHexLE(input.value, 64))
        // sequence
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse())
        // hashOutputs
        let hashOutputs = hash256(this.outputsRaw(outputs))
        hexTransaction.append(hashOutputs)

        hexTransaction.append(numberToHexLE(locktime, 32)) // locktime

        hexTransaction.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 32)) // sighash

        let sigHash = hash256(hexTransaction.raw())  // hash256 -> sha256(sha256(content))

        let scriptSig = new ByteBuffer(pairkey.signDER(sigHash))

        scriptSig.append(numberToHex(OP_CODES.SIGHASH_ALL, 8))
        
        scriptSig.prepend(numberToVarint(scriptSig.length))
       
        let publicKey = pairkey.getPublicKey()
        scriptSig.append(numberToVarint(publicKey.length))
        scriptSig.append(publicKey)

        scriptSig.prepend(numberToHex(2, 8)) // 2 items(signature & pubkey) 0x02
        
        return scriptSig.raw()
    }
        
    /**
     * Serializes transaction outputs into their raw binary format.
     * @param outputs List of transaction outputs.
     * @returns Byte array of all outputs serialized.
     */
    protected outputsRaw(outputs: OutputTransaction[]) : Uint8Array {
        const rows = outputs.map(output => {
            let txoutput = new ByteBuffer(numberToHexLE(output.amount, 64))
            let scriptPubKey = addressToScriptPubKey(output.address)
            txoutput.append(numberToVarint(scriptPubKey.length))
            txoutput.append(scriptPubKey)
            return txoutput.raw()
        }).flat()
        return ByteBuffer.merge(rows)
    }

    /**
     * Validates a transaction input.
     * Throws if txid is invalid, scriptPubKey is missing, or the txid is duplicated.
     * @param input The input to validate.
     * @param inputs The current list of inputs.
     */
    protected validateInput(input: InputTransaction, inputs: InputTransaction[]) : void
    {
        if(input.txid.length % 2 != 0)
            throw new Error("txid is in invalid format, expected a hexadecimal string")
        else if(getBytesCount(input.txid) != 32)
            throw new Error("Expected a valid txid with 32 bytes")
        else if(input.scriptPubKey && input.scriptPubKey.length % 2 != 0)
            throw new Error("scriptPubKey is in invalid format, expected a hexadecimal string") 
        if(inputs.some(i => i.txid == input.txid))
            throw new Error("An input with this txid has already been added")
    }

    /**
     * Validates a transaction output.
     * Throws if amount is non-positive, address is invalid, or address is duplicated.
     * @param output The output to validate.
     * @param outputs The current list of outputs.
     */
    protected validateOutput(output: OutputTransaction, outputs: OutputTransaction[]) : void 
    {
        if(output.amount <= 0)
            throw new Error("Expected a valid amount")
        if(!Address.isValid(output.address))
            throw new Error("Expected a valid address to output")
        if(outputs.some(o => o.address == output.address))
            throw new Error("An output with this address has already been added")
    }
}
