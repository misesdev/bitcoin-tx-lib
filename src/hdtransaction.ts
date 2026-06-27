import { HDTransactionBase } from "./base/hdtxbase";
import { TXOptions } from "./types";
import { bytesToHex, hash256 } from "./utils";

/**
 * HDTransaction represents a Bitcoin transaction using hierarchical deterministic keys.
 * Inherits from HDTransactionBase and provides high-level utilities such as fee calculation,
 * weight estimation, and raw hex retrieval.
 */
export class HDTransaction extends HDTransactionBase
{
    private feeResolved: boolean = false

    /**
     * Constructs a new HDTransaction.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(options?: TXOptions)
    {
        super(options)
    }

    /**
     * Returns the transaction ID (txid) as a hex string.
     * It is the double SHA-256 hash of the raw transaction (excluding witness data),
     * reversed in byte order.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The txid in hex string format.
     */
    public getTxid(): string 
    {    
        if(!this.cachedata.get("txidraw")) this.sign()
        
        let hexTransaction = this.cachedata.get("txidraw")
        
        if(!hexTransaction) 
            throw new Error("Transaction not signed, please sign the transactio")
        
        let txid = hash256(hexTransaction).reverse()

        return bytesToHex(txid)
    }

    /**
     * Signs the transaction and stores both the full raw transaction and
     * the stripped version used to calculate the txid.
     */
    public sign() : void {
        this.cachedata.set("txraw", this.build())
        this.cachedata.set("txidraw", this.build("txid"))
    }

    /**
     * Determines if the transaction contains any SegWit inputs.
     * @returns True if the transaction has at least one SegWit input.
     */
    public isSegwit() : boolean 
    {
        return super.isSegwit() 
    }

    /**
     * Calculates the total weight of the transaction as defined in BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes + marker/flag bytes.
     * Uses cached serialization to avoid re-signing on each call.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    public weight() : number // docs https://learnmeabitcoin.com/technical/transaction/size/
    {
        if(!this.cachedata.get("txraw")) this.sign()

        const txraw = this.cachedata.get("txraw") as Uint8Array
        const txidraw = this.cachedata.get("txidraw") as Uint8Array

        if(!this.isSegwit()) return txraw.length * 4

        const witnessMK = 2
        const witnessSize = txraw.length - txidraw.length - witnessMK
        return txidraw.length * 4 + witnessSize + witnessMK
    }

    /**
     * Calculates the virtual size (vBytes) of the transaction, defined as weight / 4.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The virtual size of the transaction in vBytes.
     */
    public vBytes() // docs https://learnmeabitcoin.com/technical/transaction/size/
    {
       	return Math.ceil(this.weight() / 4) 
    }
   
    /**
     * Resolves and deducts the transaction fee from the specified output(s).
     *
     * Fee deduction strategy:
     * - If one output: subtracts total fee from that output.
     * - If `whoPayTheFee` is "everyone": splits the fee among all outputs equally.
     * - If `whoPayTheFee` is an address: subtracts full fee from that address.
     * Idempotent: calling more than once has no additional effect.
     *
     * @throws Error if the transaction is not signed.
     */
    public resolveFee() : void
    {
        if(this.feeResolved) return

        const previousAmounts = this.outputs.map(output => output.amount)

        try {
            if(!this.cachedata.get("txraw")) this.sign()

            const feeSats = this.estimateFeeSats()

            if(this.outputs.length == 1) {
                this.deductFeeFromOutput(0, feeSats)
                this.markFeeResolved()
                return
            }

            if(this.whoPayTheFee === "everyone") {
                this.deductFeeFromEveryone(feeSats)
                this.markFeeResolved()
                return
            }

            for(let i = 0; i < this.outputs.length; i++) {
                if(this.outputs[i].address === this.whoPayTheFee) {
                    this.deductFeeFromOutput(i, feeSats)
                    this.markFeeResolved()
                    return
                }
            }

            throw new Error("Fee payer output not found")
        } catch(error) {
            this.outputs.forEach((output, index) => output.amount = previousAmounts[index])
            this.feeResolved = false
            this.cachedata.clear()
            throw error
        }
    }

    /**
     * Calculates the actual fee in satoshis from input total minus output total.
     * 
     * @returns Total transaction fee in satoshis.
     */
    public getFeeSats() 
    {
        return this.sumInputs(this.inputs) - this.sumOutputs(this.outputs)
    }

    public estimateFeeSats()
    {
        return Math.ceil(this.vBytes() * (this.fee??1))
    }

    /**
     * Returns the raw transaction as a hex-encoded string.
     * 
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction in hex format.
     */
    public getRawHex() : string 
    {
        if(!this.cachedata.get("txraw")) this.sign()
        return bytesToHex(this.cachedata.get("txraw") as Uint8Array)
    }

    /**
     * Returns the raw transaction as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction as bytes.
     */
    public getRawBytes() : Uint8Array
    {
        if(!this.cachedata.get("txraw")) this.sign()
        return this.cachedata.get("txraw") as Uint8Array
    }

    /**
     * Clears all inputs, outputs, signing keys, cache data and resets the fee state.
     */
    public override clear() : void
    {
        super.clear()
        this.feeResolved = false
    }

    protected override onTransactionMutated(): void
    {
        this.feeResolved = false
    }

    private deductFeeFromOutput(index: number, feeSats: number): void
    {
        const previousAmount = this.outputs[index].amount
        this.outputs[index].amount -= feeSats
        try {
            this.validateTransaction(this.inputs, this.outputs)
        } catch(error) {
            this.outputs[index].amount = previousAmount
            throw error
        }
    }

    private deductFeeFromEveryone(feeSats: number): void
    {
        const previousAmounts = this.outputs.map(output => output.amount)
        const baseShare = Math.floor(feeSats / this.outputs.length)
        let remainder = feeSats % this.outputs.length

        this.outputs.forEach(output => {
            output.amount -= baseShare
            if(remainder > 0) {
                output.amount -= 1
                remainder--
            }
        })

        try {
            this.validateTransaction(this.inputs, this.outputs)
        } catch(error) {
            this.outputs.forEach((output, index) => output.amount = previousAmounts[index])
            throw error
        }
    }

    private markFeeResolved(): void
    {
        this.feeResolved = true
        this.cachedata.clear()
        this.sign()
        const targetFee = this.estimateFeeSats()
        const actualFee = this.getFeeSats()
        if(actualFee < targetFee) {
            this.deductFeeFromOutput(this.outputs.length === 1 || this.whoPayTheFee !== "everyone" ? this.findFeePayerIndex() : 0, targetFee - actualFee)
            this.cachedata.clear()
            this.sign()
        }
    }

    private findFeePayerIndex(): number
    {
        if(this.outputs.length === 1) return 0
        const index = this.outputs.findIndex(output => output.address === this.whoPayTheFee)
        if(index < 0)
            throw new Error("Fee payer output not found")
        return index
    }
}



