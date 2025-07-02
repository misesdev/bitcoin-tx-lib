"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTransaction = void 0;
const txbuilder_1 = require("./txbuilder");
/**
 * Abstract base class for simple transactions with a single signing key.
 */
class BaseTransaction extends txbuilder_1.TransactionBuilder {
    /**
     * Constructs a new transaction instance with optional options.
     * @param pairKey The key pair to use for signing inputs.
     * @param options Optional transaction parameters (version, locktime, fee, etc.).
     */
    constructor(pairKey, options) {
        var _a, _b;
        super();
        /** Transaction version (default is 2) */
        this.version = 2;
        /** Transaction locktime (default is 0) */
        this.locktime = 0;
        /** List of inputs included in the transaction */
        this.inputs = [];
        /** List of outputs included in the transaction */
        this.outputs = [];
        this.pairKey = pairKey;
        this.version = (_a = options === null || options === void 0 ? void 0 : options.version) !== null && _a !== void 0 ? _a : 2;
        this.locktime = (_b = options === null || options === void 0 ? void 0 : options.locktime) !== null && _b !== void 0 ? _b : 0;
        this.whoPayTheFee = options === null || options === void 0 ? void 0 : options.whoPayTheFee;
        this.fee = options === null || options === void 0 ? void 0 : options.fee;
        this.cachedata = new Map();
    }
    /**
     * Adds a transaction input to the list.
     * Validates for duplicate txid and required fields.
     * @param input The transaction input to add.
     */
    addInput(input) {
        this.validateInput(input, this.inputs);
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if (!input.sequence)
            input.sequence = "fffffffd";
        this.inputs.push(input);
    }
    /**
     * Adds a transaction output to the list.
     * Validates for duplicate address and required fields.
     * @param output The transaction output to add.
     */
    addOutput(output) {
        this.validateOutput(output, this.outputs);
        this.outputs.push(output);
    }
    /**
     * Indicates if the transaction contains any SegWit input.
     * @returns True if any input is SegWit.
     */
    isSegwit() {
        return super.isSegwit(this.inputs);
    }
    /**
     * Builds and signs the transaction.
     * @param format Output format, either "raw" or "txid".
     * @returns Raw transaction bytes.
     */
    build(format = "raw") {
        return super.buildAndSign(this.buildSigParams(), format);
    }
    /**
     * Builds the witness field for a given input.
     * Only applicable to SegWit inputs.
     * @param input The input for which to build witness data.
     * @returns Byte array representing witness structure.
     */
    buildWitness(input) {
        return super.generateWitness(input, this.buildSigParams());
    }
    /**
     * Builds the legacy `scriptSig` for a given input.
     * Only applicable to non-SegWit inputs.
     * @param input The input for which to build the scriptSig.
     * @returns Byte array representing the scriptSig.
     */
    buildScriptSig(input) {
        return super.generateScriptSig(input, this.buildSigParams());
    }
    /**
     * Clears all inputs, outputs, and cache data.
     */
    clear() {
        this.inputs = [];
        this.outputs = [];
        this.cachedata.clear();
    }
    /**
     * Generates the signing parameters object used throughout transaction signing.
     * @returns A complete SigParams object.
     */
    buildSigParams() {
        return {
            version: this.version,
            locktime: this.locktime,
            inputs: this.inputs,
            outputs: this.outputs,
            pairkey: this.pairKey
        };
    }
}
exports.BaseTransaction = BaseTransaction;
//# sourceMappingURL=txbase.js.map