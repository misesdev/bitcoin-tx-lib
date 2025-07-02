import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
import { TXOptions } from "./types";
export declare class Transaction extends BaseTransaction {
    /**
     * Creates a new Transaction instance.
     * @param pairkey The key pair used to sign the transaction inputs.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(pairkey: ECPairKey, options?: TXOptions);
    /**
     * Signs the transaction.
     * Caches the raw transaction data and the version used for txid calculation.
     */
    sign(): void;
    /**
     * Returns the transaction ID (txid) as a hex string.
     * The txid is the double SHA-256 hash of the stripped raw transaction (no witness data), reversed in byte order.
     *
     * @throws Error if the transaction is not signed.
     * @returns The txid as a hex string.
     */
    getTxid(): string;
    /**
     * Calculates the total weight of the transaction according to BIP 141.
     * Weight = (non-witness bytes * 4) + witness bytes.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction weight.
     */
    weight(): number;
    /**
     * Calculates the virtual size (vBytes) of the transaction.
     * Defined as weight divided by 4.
     *
     * @throws Error if the transaction is not signed.
     * @returns The transaction virtual size in bytes.
     */
    vBytes(): number;
    /**
     * Deducts the transaction fee from the output(s) according to the fee-paying strategy.
     * If only one output exists, deduct the entire fee from it.
     * If `whoPayTheFee` is "everyone", split the fee evenly among all outputs.
     * If `whoPayTheFee` is an address, deduct the fee from the output matching that address.
     *
     * @throws Error if the transaction is not signed.
     */
    resolveFee(): void;
    /**
     * Calculates the total fee in satoshis based on the virtual size and fee rate.
     *
     * @returns The transaction fee in satoshis.
     */
    getFeeSats(): number;
    /**
     * Returns the raw transaction as a hex string.
     *
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction hex string.
     */
    getRawHex(): string;
    /**
     * Returns the raw transaction bytes as a Uint8Array.
     *
     * @throws Error if the transaction is not signed.
     * @returns The raw transaction bytes.
     */
    getRawBytes(): Uint8Array;
}
