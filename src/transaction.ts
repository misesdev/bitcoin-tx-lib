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

        if(!this.cachedata.get("txraw")) this.sign()

        const satoshisPerOutput = Math.ceil(this.vBytes() * (this.fee??1))

        if(this.outputs.length == 1) {
            this.outputs[0].amount -= satoshisPerOutput
            this.feeResolved = true
            this.cachedata.clear()
            return
        }

        if(this.whoPayTheFee === "everyone") {
            const share = Math.ceil(this.vBytes() * (this.fee??1) / this.outputs.length)
            this.outputs.forEach(out => out.amount -= share)
            this.feeResolved = true
            this.cachedata.clear()
            return
        }

        for(let i = 0; i < this.outputs.length; i++) {
            if(this.outputs[i].address === this.whoPayTheFee) {
                this.outputs[i].amount -= satoshisPerOutput
                this.feeResolved = true
                this.cachedata.clear()
                break
            }
        }
    }

    /**
     * Calculates the total fee in satoshis based on the virtual size and fee rate.
     * 
     * @returns The transaction fee in satoshis.
     */
    public getFeeSats() 
    {
        if(this.whoPayTheFee && this.fee) this.resolveFee()
        const feeSats = Math.ceil(this.vBytes() * (this.fee??1))
        return feeSats
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
}



