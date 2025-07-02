import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction, TXOptions } from "../types";
import { BuildFormat, TransactionBuilder } from "./txbuilder";
/**
 * Abstract base class for building HD (Hierarchical Deterministic) Bitcoin transactions,
 * supporting per-input signing using separate key pairs.
 */
export declare abstract class HDTransactionBase extends TransactionBuilder {
    /** Transaction version (default is 2) */
    version: number;
    /** Transaction locktime (default is 0) */
    locktime: number;
    /** List of inputs included in the transaction */
    inputs: InputTransaction[];
    /** List of outputs included in the transaction */
    outputs: OutputTransaction[];
    /** Mapping of input identifier (txid:vout) to its corresponding signing key */
    protected signingKeys: Map<string, ECPairKey>;
    /** Internal cache for precomputed data (e.g. transaction size, hashes) */
    protected cachedata: Map<string, Uint8Array>;
    /** Defines which output pays the fee; can be an address or "everyone" */
    protected whoPayTheFee?: string;
    /** Fee rate in satoshis per virtual byte */
    protected fee?: number;
    /**
     * Constructs an HDTransactionBase instance with optional transaction settings.
     * @param options Optional transaction configuration: version, locktime, fee, who pays the fee.
     */
    constructor(options?: TXOptions);
    /**
     * Adds a transaction input and associates a signing key to it.
     * @param input The transaction input to be added.
     * @param pairkey The key pair used to sign this specific input.
     * @throws If the input is invalid or already exists.
     */
    addInput(input: InputTransaction, pairkey: ECPairKey): void;
    /**
     * Adds an output to the transaction.
     * @param output The output (address and amount) to be added.
     * @throws If the output is invalid or duplicated.
     */
    addOutput(output: OutputTransaction): void;
    /**
     * Checks if the transaction contains at least one SegWit input.
     * @returns True if any input is SegWit, false otherwise.
     */
    isSegwit(): boolean;
    /**
     * Builds the raw transaction (optionally for txid calculation).
     * Handles both SegWit and legacy inputs.
     * @param format Output format, either "raw" (default) or "txid".
     * @returns Serialized transaction as Uint8Array.
     * @throws If any input lacks its associated signing key.
     */
    protected build(format?: BuildFormat): Uint8Array;
    /**
     * Generates the witness data for a SegWit input.
     * @param input The input to generate witness for.
     * @returns Serialized witness field.
     * @throws If the input has no associated signing key.
     */
    protected buildWitness(input: InputTransaction): Uint8Array;
    /**
     * Generates the legacy scriptSig for a non-SegWit input.
     * @param input The input to generate the scriptSig for.
     * @returns Serialized scriptSig.
     * @throws If the input has no associated signing key.
     */
    protected buildScriptSig(input: InputTransaction): Uint8Array;
    /**
     * Clears all inputs, outputs, cached data, and signing keys.
     */
    clear(): void;
    /**
     * Generates a unique key for the signingKeys map based on txid and vout.
     * @param input The input to derive the key from.
     * @returns A string in the format "txid:vout".
     */
    private getkey;
    /**
     * Validates that all inputs have an associated signing key.
     * @throws If any input is missing its corresponding key.
     */
    private validateSigning;
}
