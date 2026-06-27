import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { bytesToHex, hash256 } from "./utils";
import { TXOptions } from "./types";

export class Transaction extends BaseTransaction {

    private feeResolved: boolean = false

    /**
     * Creates a new Transaction instance.
     * @param pairkey The key pair used to sign the transaction inputs.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(pairkey: ECPairKey, options?: TXOptions)
    {
        super(pairkey, options)
    }

    /**
     * Signs the transaction.
     * Caches the raw transaction data and the version used for txid calculation.
     */
    public sign() : void {
        this.cachedata.set("txraw", this.build())
        this.cachedata.set("txidraw", this.build("txid"))
    }

    /**
     * Returns the transaction ID (txid) as a hex string.
     * The txid is the double SHA-256 hash of the stripped raw transaction (no witness data), reversed in byte order.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The txid as a hex string.
     */
    public getTxid(): string 
    {    
        if(!this.cachedata.get("txidraw")) this.sign()
        
        let hexTransaction = this.cachedata.get("txidraw")
        
        if(!hexTransaction) 
            throw new Error("Transaction not signed, please sign the transaction")
        
        let txid = hash256(hexTransaction).reverse()

        return bytesToHex(txid)
    }

    /**
     * Calculates the total weight of the transaction according to BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes + marker/flag bytes.
     * Uses cached serialization to avoid re-signing on each call.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    public weight() : number
    {
        // docs https://learnmeabitcoin.com/technical/transaction/size/
        if(!this.cachedata.get("txraw")) this.sign()

        const txraw = this.cachedata.get("txraw") as Uint8Array
        const txidraw = this.cachedata.get("txidraw") as Uint8Array

        if(!this.isSegwit()) return txraw.length * 4

        // txraw includes: non-witness bytes + 2 marker/flag bytes + witness bytes
        // txidraw includes: non-witness bytes only (stripped serialization for txid)
        const witnessMK = 2
        const witnessSize = txraw.length - txidraw.length - witnessMK
        return txidraw.length * 4 + witnessSize + witnessMK
    }

    /**
     * Calculates the virtual size (vBytes) of the transaction.
     * Defined as weight divided by 4.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The transaction virtual size in bytes.
     */
    public vBytes()
    {
        // docs https://learnmeabitcoin.com/technical/transaction/size/
       	return Math.ceil(this.weight() / 4) 
    }
  
    /**
     * Deducts the transaction fee from the output(s) according to the fee-paying strategy.
     * If only one output exists, deduct the entire fee from it.
     * If `whoPayTheFee` is "everyone", split the fee evenly among all outputs.
     * If `whoPayTheFee` is an address, deduct the fee from the output matching that address.
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
     * @returns The transaction fee in satoshis.
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
     * Returns the raw transaction as a hex string.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction hex string.
     */
    public getRawHex() : string 
    {
        if(!this.cachedata.get("txraw")) this.sign()
        return bytesToHex(this.cachedata.get("txraw") as Uint8Array)
    }

    /**
     * Returns the raw transaction bytes as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction bytes.
     */
    public getRawBytes() : Uint8Array
    {
        if(!this.cachedata.get("txraw")) this.sign()
        return this.cachedata.get("txraw") as Uint8Array
    }

    /**
     * Clears all inputs, outputs, cache data and resets the fee state.
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



