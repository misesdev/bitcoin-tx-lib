import { ECPairKey } from "../ecpairkey"
import { InputTransaction, OutputTransaction, TXOptions } from "../types"
import { bytesToHex, hexToBytes, numberToHexLE, numberToVarint } from "../utils"
import { ByteBuffer } from "../utils/buffer"
import { addressToScriptPubKey } from "../utils/txutils"
import { BuildFormat, TransactionBuilder } from "./txbuilder"

/**
 * Abstract base class for building HD (Hierarchical Deterministic) Bitcoin transactions,
 * supporting per-input signing using separate key pairs.
 */
export abstract class HDTransactionBase extends TransactionBuilder
{
    /** Transaction version (default is 2) */
    public version: number = 2 

    /** Transaction locktime (default is 0) */
    public locktime: number = 0

    /** List of inputs included in the transaction */
    public inputs: InputTransaction[] = []

    /** List of outputs included in the transaction */
    public outputs: OutputTransaction[] = []  

    /** Mapping of input identifier (txid:vout) to its corresponding signing key */
    protected signingKeys: Map<string, ECPairKey>

    /** Internal cache for precomputed data (e.g. transaction size, hashes) */
    protected cachedata: Map<string, Uint8Array>

    /** Defines which output pays the fee; can be an address or "everyone" */
    protected whoPayTheFee?: string

    /** Fee rate in satoshis per virtual byte */
    protected fee?: number

    /**
     * Constructs an HDTransactionBase instance with optional transaction settings.
     * @param options Optional transaction configuration: version, locktime, fee, who pays the fee.
     */
    constructor(options?: TXOptions)
    {
        super()
        this.signingKeys = new Map()
        this.version = options?.version ?? 2
        this.locktime = options?.locktime ?? 0
        this.whoPayTheFee = options?.whoPayTheFee
        this.fee = options?.fee
        this.cachedata = new Map()
    }

    /**
     * Adds a transaction input and associates a signing key to it.
     * @param input The transaction input to be added.
     * @param pairkey The key pair used to sign this specific input.
     * @throws If the input is invalid or already exists.
     */    
    public addInput(input: InputTransaction, pairkey: ECPairKey) 
    { 
        this.validateInput(input, this.inputs)
        
        if(!input.scriptPubKey)
            input.scriptPubKey = bytesToHex(addressToScriptPubKey(pairkey.getAddress()))

        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if(!input.sequence) input.sequence = "fffffffd"

        this.signingKeys.set(this.getkey(input), pairkey)
        this.inputs.push(input)
    }

    /**
     * Adds an output to the transaction.
     * @param output The output (address and amount) to be added.
     * @throws If the output is invalid or duplicated.
     */
    public addOutput(output: OutputTransaction) 
    {
        this.validateOutput(output, this.outputs)

        this.outputs.push(output)
    }

    /**
     * Checks if the transaction contains at least one SegWit input.
     * @returns True if any input is SegWit, false otherwise.
     */
    public override isSegwit(): boolean
    {
        return super.isSegwit(this.inputs)
    }

    /**
     * Builds the raw transaction (optionally for txid calculation).
     * Handles both SegWit and legacy inputs.
     * @param format Output format, either "raw" (default) or "txid".
     * @returns Serialized transaction as Uint8Array.
     * @throws If any input lacks its associated signing key.
     */
    protected build(format: BuildFormat = "raw") : Uint8Array
    {   
        this.validateSigning()

        let witnessData = new ByteBuffer()
        
        let hexTransaction = new ByteBuffer(numberToHexLE(this.version, 32)) // version

        if(this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])) //"00" + "01";

        // number of inputs
        hexTransaction.append(numberToVarint(this.inputs.length))
        
        this.inputs.forEach(input => {
            hexTransaction.append(hexToBytes(input.txid).reverse()) // txid
            hexTransaction.append(numberToHexLE(input.vout, 32)) // index output (vout)

            if(this.isSegwitInput(input)) {
                witnessData.append(this.buildWitness(input))
                hexTransaction.append(new Uint8Array([0])) // script sig in witness area // P2WPKH 
            } else {
                let scriptSig = this.buildScriptSig(input)
                hexTransaction.append(numberToHexLE(scriptSig.length, 8))
                hexTransaction.append(scriptSig)
                witnessData.append(new Uint8Array([0])) // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append(hexToBytes(input.sequence??"fffffffd").reverse()) // 0xfffffffd
        })

        hexTransaction.append(numberToVarint(this.outputs.length)) // number of outputs

        hexTransaction.append(this.outputsRaw(this.outputs)) // amount+scriptpubkey

        if(this.isSegwit() && format != "txid") hexTransaction.append(witnessData.raw())

        hexTransaction.append(numberToHexLE(this.locktime, 32)) // locktime

        return hexTransaction.raw()
    }

    /**
     * Generates the witness data for a SegWit input.
     * @param input The input to generate witness for.
     * @returns Serialized witness field.
     * @throws If the input has no associated signing key.
     */
    protected buildWitness(input: InputTransaction) 
    {
        const pairkey = this.signingKeys.get(this.getkey(input))
        if(!pairkey)
            throw new Error("Transaction not signed, please sign the transaction")
        return super.generateWitness(input, {
            version: this.version,
            locktime: this.locktime,
            inputs: this.inputs,
            outputs: this.outputs,
            pairkey: pairkey
        })
    }

    /**
     * Generates the legacy scriptSig for a non-SegWit input.
     * @param input The input to generate the scriptSig for.
     * @returns Serialized scriptSig.
     * @throws If the input has no associated signing key.
     */
    protected buildScriptSig(input: InputTransaction) 
    {
        const pairkey = this.signingKeys.get(this.getkey(input))
        if(!pairkey)
            throw new Error("Transaction not signed, please sign the transaction")
        return super.generateScriptSig(input, {
            version: this.version,
            locktime: this.locktime,
            inputs: this.inputs,
            outputs: this.outputs,
            pairkey
        })
    }
    
    /**
     * Clears all inputs, outputs, cached data, and signing keys.
     */
    public clear() 
    {
        this.inputs = []
        this.outputs = []
        this.signingKeys.clear()
        this.cachedata.clear()
    }

    /**
     * Generates a unique key for the signingKeys map based on txid and vout.
     * @param input The input to derive the key from.
     * @returns A string in the format "txid:vout".
     */
    private getkey(input: InputTransaction) : string 
    {
        return `${input.txid}:${input.vout}`
    }

    /**
     * Validates that all inputs have an associated signing key.
     * @throws If any input is missing its corresponding key.
     */
    private validateSigning() : void {
        for (const input of this.inputs) {
            if (!this.signingKeys.has(this.getkey(input)))
                throw new Error(`Missing signing key for input ${JSON.stringify(input)}`)
        }
    }
}
