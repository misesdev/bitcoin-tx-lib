"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const txbase_1 = require("./base/txbase");
const utils_1 = require("./utils");
class Transaction extends txbase_1.BaseTransaction {
    /**
     * Creates a new Transaction instance.
     * @param pairkey The key pair used to sign the transaction inputs.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(pairkey, options) {
        super(pairkey, options);
        this.feeResolved = false;
    }
    /**
     * Signs the transaction.
     * Caches the raw transaction data and the version used for txid calculation.
     */
    sign() {
        this.cachedata.set("txraw", this.build());
        this.cachedata.set("txidraw", this.build("txid"));
    }
    /**
     * Returns the transaction ID (txid) as a hex string.
     * The txid is the double SHA-256 hash of the stripped raw transaction (no witness data), reversed in byte order.
     *
     * @throws Error if the transaction is not signed.
     * @returns The txid as a hex string.
     */
    getTxid() {
        if (!this.cachedata.get("txidraw"))
            this.sign();
        let hexTransaction = this.cachedata.get("txidraw");
        if (!hexTransaction)
            throw new Error("Transaction not signed, please sign the transaction");
        let txid = (0, utils_1.hash256)(hexTransaction).reverse();
        return (0, utils_1.bytesToHex)(txid);
    }
    /**
     * Calculates the total weight of the transaction according to BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes + marker/flag bytes.
     * Uses cached serialization to avoid re-signing on each call.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    weight() {
        // docs https://learnmeabitcoin.com/technical/transaction/size/
        if (!this.cachedata.get("txraw"))
            this.sign();
        const txraw = this.cachedata.get("txraw");
        const txidraw = this.cachedata.get("txidraw");
        if (!this.isSegwit())
            return txraw.length * 4;
        // txraw includes: non-witness bytes + 2 marker/flag bytes + witness bytes
        // txidraw includes: non-witness bytes only (stripped serialization for txid)
        const witnessMK = 2;
        const witnessSize = txraw.length - txidraw.length - witnessMK;
        return txidraw.length * 4 + witnessSize + witnessMK;
    }
    /**
     * Calculates the virtual size (vBytes) of the transaction.
     * Defined as weight divided by 4.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction virtual size in bytes.
     */
    vBytes() {
        // docs https://learnmeabitcoin.com/technical/transaction/size/
        return Math.ceil(this.weight() / 4);
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
    resolveFee() {
        var _a, _b;
        if (this.feeResolved)
            return;
        if (!this.cachedata.get("txraw"))
            this.sign();
        const satoshisPerOutput = Math.ceil(this.vBytes() * ((_a = this.fee) !== null && _a !== void 0 ? _a : 1));
        if (this.outputs.length == 1) {
            this.outputs[0].amount -= satoshisPerOutput;
            this.feeResolved = true;
            this.cachedata.clear();
            return;
        }
        if (this.whoPayTheFee === "everyone") {
            const share = Math.ceil(this.vBytes() * ((_b = this.fee) !== null && _b !== void 0 ? _b : 1) / this.outputs.length);
            this.outputs.forEach(out => out.amount -= share);
            this.feeResolved = true;
            this.cachedata.clear();
            return;
        }
        for (let i = 0; i < this.outputs.length; i++) {
            if (this.outputs[i].address === this.whoPayTheFee) {
                this.outputs[i].amount -= satoshisPerOutput;
                this.feeResolved = true;
                this.cachedata.clear();
                break;
            }
        }
    }
    /**
     * Calculates the total fee in satoshis based on the virtual size and fee rate.
     *
     * @returns The transaction fee in satoshis.
     */
    getFeeSats() {
        var _a;
        if (this.whoPayTheFee && this.fee)
            this.resolveFee();
        const feeSats = Math.ceil(this.vBytes() * ((_a = this.fee) !== null && _a !== void 0 ? _a : 1));
        return feeSats;
    }
    /**
     * Returns the raw transaction as a hex string.
     *
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction hex string.
     */
    getRawHex() {
        if (!this.cachedata.get("txraw"))
            this.sign();
        return (0, utils_1.bytesToHex)(this.cachedata.get("txraw"));
    }
    /**
     * Returns the raw transaction bytes as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction bytes.
     */
    getRawBytes() {
        if (!this.cachedata.get("txraw"))
            this.sign();
        return this.cachedata.get("txraw");
    }
    /**
     * Clears all inputs, outputs, cache data and resets the fee state.
     */
    clear() {
        super.clear();
        this.feeResolved = false;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map