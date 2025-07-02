import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction, TXOptions } from "../types";
import { BuildFormat, TransactionBuilder } from "./txbuilder";
/**
 * Abstract base class for simple transactions with a single signing key.
 */
export declare abstract class BaseTransaction extends TransactionBuilder {
    /** Transaction version (default is 2) */
    version: number;
    /** Transaction locktime (default is 0) */
    locktime: number;
    /** List of inputs included in the transaction */
    inputs: InputTransaction[];
    /** List of outputs included in the transaction */
    outputs: OutputTransaction[];
    /** Internal cache for precomputed data (e.g. transaction size, hashes) */
    protected cachedata: Map<string, Uint8Array>;
    /** Defines which output pays the fee; can be an address or "everyone" */
    protected whoPayTheFee?: string;
    /** Fee rate in satoshis per virtual byte */
    protected fee?: number;
    /** Key pair used for signing the transaction. */
    protected pairKey: ECPairKey;
    /**
     * Constructs a new transaction instance with optional options.
     * @param pairKey The key pair to use for signing inputs.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(pairKey: ECPairKey, options?: TXOptions);
    /**
     * Adds a transaction input to the list.
     * Validates for duplicate txid and required fields.
     * @param input The transaction input to add.
     */
    addInput(input: InputTransaction): void;
    /**
     * Adds a transaction output to the list.
     * Validates for duplicate address and required fields.
     * @param output The transaction output to add.
     */
    addOutput(output: OutputTransaction): void;
    /**
     * Indicates if the transaction contains any SegWit input.
     * @returns True if any input is SegWit.
     */
    isSegwit(): boolean;
    /**
     * Builds and signs the transaction.
     * @param format Output format, either "raw" or "txid".
     * @returns Raw transaction bytes.
     */
    protected build(format?: BuildFormat): Uint8Array;
    /**
     * Builds the witness field for a given input.
     * Only applicable to SegWit inputs.
     * @param input The input for which to build witness data.
     * @returns Byte array representing witness structure.
     */
    protected buildWitness(input: InputTransaction): Uint8Array;
    /**
     * Builds the legacy `scriptSig` for a given input.
     * Only applicable to non-SegWit inputs.
     * @param input The input for which to build the scriptSig.
     * @returns Byte array representing the scriptSig.
     */
    protected buildScriptSig(input: InputTransaction): Uint8Array;
    /**
     * Clears all inputs, outputs, and cache data.
     */
    clear(): void;
    /**
     * Generates the signing parameters object used throughout transaction signing.
     * @returns A complete SigParams object.
     */
    private buildSigParams;
}
