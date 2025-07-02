import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction } from "../types";
export type BuildFormat = "raw" | "txid";
export interface SigParams {
    inputs: InputTransaction[];
    outputs: OutputTransaction[];
    pairkey: ECPairKey;
    locktime: number;
    version: number;
}
/**
 * Base class for building and signing Bitcoin transactions (both Legacy and SegWit).
 */
export declare abstract class TransactionBuilder {
    /**
     * Determines if any input is a SegWit (P2WPKH or P2WSH) input.
     * @param inputs List of transaction inputs.
     * @returns True if at least one input is SegWit.
     */
    isSegwit(inputs: InputTransaction[]): boolean;
    /**
     * Checks if a specific input is a SegWit input (P2WPKH or P2WSH).
     * @param input The input to check.
     * @returns True if input is SegWit.
     */
    isSegwitInput(input: InputTransaction): boolean;
    /**
     * Builds and signs the entire transaction.
     * @param params Signing parameters including inputs, outputs, key, version and locktime.
     * @param format Whether to generate a "raw" or "txid" version.
     * @returns Raw transaction bytes.
     */
    protected buildAndSign(params: SigParams, format?: BuildFormat): Uint8Array;
    /**
     * Generates the `scriptSig` for a legacy (non-SegWit) P2PKH input.
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The generated `scriptSig` as a byte array.
     */
    protected generateScriptSig(input: InputTransaction, { inputs, outputs, pairkey, locktime, version }: SigParams): Uint8Array;
    /**
     * Generates the witness data for a SegWit input (P2WPKH).
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The witness field as a byte array.
     */
    protected generateWitness(input: InputTransaction, { inputs, outputs, pairkey, locktime, version }: SigParams): Uint8Array;
    /**
     * Serializes transaction outputs into their raw binary format.
     * @param outputs List of transaction outputs.
     * @returns Byte array of all outputs serialized.
     */
    protected outputsRaw(outputs: OutputTransaction[]): Uint8Array;
    /**
     * Validates a transaction input.
     * Throws if txid is invalid, scriptPubKey is missing, or the txid is duplicated.
     * @param input The input to validate.
     * @param inputs The current list of inputs.
     */
    protected validateInput(input: InputTransaction, inputs: InputTransaction[]): void;
    /**
     * Validates a transaction output.
     * Throws if amount is non-positive, address is invalid, or address is duplicated.
     * @param output The output to validate.
     * @param outputs The current list of outputs.
     */
    protected validateOutput(output: OutputTransaction, outputs: OutputTransaction[]): void;
}
