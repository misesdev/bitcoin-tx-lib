import { HDTransactionBase } from "./base/hdtxbase";
import { TXOptions } from "./types";
/**
 * HDTransaction represents a Bitcoin transaction using hierarchical deterministic keys.
 * Inherits from HDTransactionBase and provides high-level utilities such as fee calculation,
 * weight estimation, and raw hex retrieval.
 */
export declare class HDTransaction extends HDTransactionBase {
    /**
     * Constructs a new HDTransaction.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(options?: TXOptions);
    /**
     * Returns the transaction ID (txid) as a hex string.
     * It is the double SHA-256 hash of the raw transaction (excluding witness data),
     * reversed in byte order.
     *
     * @throws Error if the transaction is not signed.
     * @returns The txid in hex string format.
     */
    getTxid(): string;
    /**
     * Signs the transaction and stores both the full raw transaction and
     * the stripped version used to calculate the txid.
     */
    sign(): void;
    /**
     * Determines if the transaction contains any SegWit inputs.
     * @returns True if the transaction has at least one SegWit input.
     */
    isSegwit(): boolean;
    /**
     * Calculates the total weight of the transaction as defined in BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    weight(): number;
    /**
     * Calculates the virtual size (vBytes) of the transaction, defined as weight / 4.
     *
     * @throws Error if the transaction is not signed.
     * @returns The virtual size of the transaction in vBytes.
     */
    vBytes(): number;
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
    resolveFee(): void;
    /**
     * Calculates the fee in satoshis based on vBytes and configured fee rate.
     *
     * @returns Total transaction fee in satoshis.
     */
    getFeeSats(): number;
    /**
     * Returns the raw transaction as a hex-encoded string.
     *
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction in hex format.
     */
    getRawHex(): string;
    /**
     * Returns the raw transaction as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns Raw transaction as bytes.
     */
    getRawBytes(): Uint8Array;
}
