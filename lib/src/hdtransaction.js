"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDTransaction = void 0;
const hdtxbase_1 = require("./base/hdtxbase");
const utils_1 = require("./utils");
/**
 * HDTransaction represents a Bitcoin transaction using hierarchical deterministic keys.
 * Inherits from HDTransactionBase and provides high-level utilities such as fee calculation,
 * weight estimation, and raw hex retrieval.
 */
class HDTransaction extends hdtxbase_1.HDTransactionBase {
    /**
     * Constructs a new HDTransaction.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(options) {
        super(options);
    }
    /**
     * Returns the transaction ID (txid) as a hex string.
     * It is the double SHA-256 hash of the raw transaction (excluding witness data),
     * reversed in byte order.
     *
     * @throws Error if the transaction is not signed.
     * @returns The txid in hex string format.
     */
    getTxid() {
        let hexTransaction = this.cachedata.get("txidraw");
        if (!hexTransaction)
            throw new Error("Transaction not signed, please sign the transactio");
        let txid = (0, utils_1.hash256)(hexTransaction).reverse();
        return (0, utils_1.bytesToHex)(txid);
    }
    /**
     * Signs the transaction and stores both the full raw transaction and
     * the stripped version used to calculate the txid.
     */
    sign() {
        this.cachedata.set("txraw", this.build());
        this.cachedata.set("txidraw", this.build());
    }
    /**
     * Determines if the transaction contains any SegWit inputs.
     * @returns True if the transaction has at least one SegWit input.
     */
    isSegwit() {
        return super.isSegwit();
    }
    /**
     * Calculates the total weight of the transaction as defined in BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    weight() {
        if (!this.cachedata.get("txraw"))
            throw ("Transaction not signed, please sign the transaction");
        // witness marker and flag * 1
        let witnessMK = 0; // 2 bytes of marker and flag 0x00+0x01 = 2 bytes * 1
        if (this.isSegwit())
            witnessMK = 2;
        let hexTransaction = this.build();
        let witnessInputs = this.inputs.filter(this.isSegwitInput);
        // witness size * 1
        let witnessSize = witnessInputs.reduce((sum, input) => {
            let witness = this.buildWitness(input);
            return sum + witness.length;
        }, 0);
        // discount the size of the witness fields and multiply by 4
        let transactionSize = hexTransaction.length;
        transactionSize = (transactionSize - (witnessSize + witnessMK)) * 4;
        transactionSize += (witnessSize + witnessMK); // * 1
        return Math.ceil(transactionSize);
    }
    /**
     * Calculates the virtual size (vBytes) of the transaction, defined as weight / 4.
     *
     * @throws Error if the transaction is not signed.
     * @returns The virtual size of the transaction in vBytes.
     */
    vBytes() {
        return Math.ceil(this.weight() / 4);
    }
    /**
     * Resolves and deducts the transaction fee from the specified output(s).
     *
     * Fee deduction strategy:
     * - If one output: subtracts total fee from that output.
     * - If `whoPayTheFee` is "everyone": splits the fee among all outputs equally.
     * - If `whoPayTheFee` is an address: subtracts full fee from that address.
     *
     * @throws Error if the transaction is not signed.
     */
    resolveFee() {
        var _a, _b;
        if (!this.cachedata.get("txraw"))
            throw ("Transaction not signed, please sign the transaction");
        let satoshis = Math.ceil(this.vBytes() * ((_a = this.fee) !== null && _a !== void 0 ? _a : 1));
        if (this.outputs.length == 1) {
            this.outputs[0].amount -= satoshis;
            return;
        }
        if (this.whoPayTheFee === "everyone") {
            satoshis = Math.ceil(this.vBytes() * ((_b = this.fee) !== null && _b !== void 0 ? _b : 1) / this.outputs.length);
            this.outputs.forEach(out => out.amount -= satoshis);
        }
        for (let i = 0; i < this.outputs.length; i++) {
            if (this.outputs[i].address == this.whoPayTheFee) {
                this.outputs[i].amount -= satoshis;
                break;
            }
        }
    }
    /**
     * Calculates the fee in satoshis based on vBytes and configured fee rate.
     *
     * @returns Total transaction fee in satoshis.
     */
    getFeeSats() {
        var _a;
        return Math.ceil(this.vBytes() * ((_a = this.fee) !== null && _a !== void 0 ? _a : 1));
    }
    /**
     * Returns the raw transaction as a hex-encoded string.
     *
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction in hex format.
     */
    getRawHex() {
        const raw = this.cachedata.get("txraw");
        if (!raw)
            throw new Error("Transaction not signed, please sign the transaction");
        return (0, utils_1.bytesToHex)(raw);
    }
    /**
     * Returns the raw transaction as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction as bytes.
     */
    getRawBytes() {
        const raw = this.cachedata.get("txraw");
        if (!raw)
            throw new Error("Transaction not signed, please sign the transaction");
        return raw;
    }
}
exports.HDTransaction = HDTransaction;
//# sourceMappingURL=hdtransaction.js.map