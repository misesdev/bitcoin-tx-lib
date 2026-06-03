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
     * Calculates the fee in satoshis based on vBytes and configured fee rate.
     * 
     * @returns Total transaction fee in satoshis.
     */
    public getFeeSats() 
    {
        if(this.whoPayTheFee && this.fee) this.resolveFee()
        const feeSats = Math.ceil(this.vBytes() * (this.fee??1))
        return feeSats
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
}



