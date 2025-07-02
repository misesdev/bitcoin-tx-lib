import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { bytesToHex, hash256 } from "./utils";
import { TXOptions } from "./types";

export class Transaction extends BaseTransaction {

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
        let hexTransaction = this.cachedata.get("txidraw")
        
        if(!hexTransaction) 
            throw new Error("Transaction not signed, please sign the transaction")
        
        let txid = hash256(hexTransaction).reverse()

        return bytesToHex(txid)
    }

    /**
     * Calculates the total weight of the transaction according to BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    public weight() : number 
    {
        // docs https://learnmeabitcoin.com/technical/transaction/size/
        if(!this.cachedata.get("txraw"))
            throw("Transaction not signed, please sign the transaction")
	    // witness marker and flag * 1
        let witnessMK = 0 // 2 bytes of marker and flag 0x00+0x01 = 2 bytes * 1
       
        if(this.isSegwit()) witnessMK = 2

        let hexTransaction = this.cachedata.get("txraw") ?? this.build()
        
        let witnessInputs = this.inputs.filter(this.isSegwitInput)
	    // witness size * 1
        let witnessSize = witnessInputs.reduce((sum, input) => {
            let witness = this.buildWitness(input)
            return sum + witness.length
        }, 0) 
        // discount the size of the witness fields and multiply by 4
        let transactionSize = hexTransaction.length
        transactionSize = (transactionSize - (witnessSize + witnessMK)) * 4 
        transactionSize += (witnessSize + witnessMK) // * 1
        
        return Math.ceil(transactionSize)
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
     * 
     * @throws Error if the transaction is not signed.
     */
    public resolveFee() : void
    {
        if(!this.cachedata.get("txraw"))
            throw("Transaction not signed, please sign the transaction")
        
        let satoshis = Math.ceil(this.vBytes() * (this.fee??1))

        if(this.outputs.length == 1) {
            this.outputs[0].amount -= satoshis
            return
        }
        
        if(this.whoPayTheFee === "everyone") {
            satoshis = Math.ceil(this.vBytes() * (this.fee??1) / this.outputs.length)
            this.outputs.forEach(out => out.amount -= satoshis)
        }

        for(let i = 0; i < this.outputs.length; i++) {
            if(this.outputs[i].address == this.whoPayTheFee) {
                this.outputs[i].amount -= satoshis
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
        return Math.ceil(this.vBytes() * (this.fee??1))
    }

    /**
     * Returns the raw transaction as a hex string.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction hex string.
     */
    public getRawHex() : string {
        const raw = this.cachedata.get("txraw")
        if(!raw) throw new Error("Unsigned transaction")
        return bytesToHex(raw)
    }

    /**
     * Returns the raw transaction bytes as a Uint8Array.
     * 
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction bytes.
     */
    public getRawBytes() : Uint8Array {
        const raw = this.cachedata.get("txraw")
        if(!raw) throw new Error("Unsigned transaction")
        return raw
    }
}



