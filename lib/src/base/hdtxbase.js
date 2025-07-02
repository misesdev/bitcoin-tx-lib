"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDTransactionBase = void 0;
const utils_1 = require("../utils");
const buffer_1 = require("../utils/buffer");
const txbuilder_1 = require("./txbuilder");
/**
 * Abstract base class for building HD (Hierarchical Deterministic) Bitcoin transactions,
 * supporting per-input signing using separate key pairs.
 */
class HDTransactionBase extends txbuilder_1.TransactionBuilder {
    /**
     * Constructs an HDTransactionBase instance with optional transaction settings.
     * @param options Optional transaction configuration: version, locktime, fee, who pays the fee.
     */
    constructor(options) {
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
        this.signingKeys = new Map();
        this.version = (_a = options === null || options === void 0 ? void 0 : options.version) !== null && _a !== void 0 ? _a : 2;
        this.locktime = (_b = options === null || options === void 0 ? void 0 : options.locktime) !== null && _b !== void 0 ? _b : 0;
        this.whoPayTheFee = options === null || options === void 0 ? void 0 : options.whoPayTheFee;
        this.fee = options === null || options === void 0 ? void 0 : options.fee;
        this.cachedata = new Map();
    }
    /**
     * Adds a transaction input and associates a signing key to it.
     * @param input The transaction input to be added.
     * @param pairkey The key pair used to sign this specific input.
     * @throws If the input is invalid or already exists.
     */
    addInput(input, pairkey) {
        this.validateInput(input, this.inputs);
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if (!input.sequence)
            input.sequence = "fffffffd";
        this.signingKeys.set(this.getkey(input), pairkey);
        this.inputs.push(input);
    }
    /**
     * Adds an output to the transaction.
     * @param output The output (address and amount) to be added.
     * @throws If the output is invalid or duplicated.
     */
    addOutput(output) {
        this.validateOutput(output, this.outputs);
        this.outputs.push(output);
    }
    /**
     * Checks if the transaction contains at least one SegWit input.
     * @returns True if any input is SegWit, false otherwise.
     */
    isSegwit() {
        return super.isSegwit(this.inputs);
    }
    /**
     * Builds the raw transaction (optionally for txid calculation).
     * Handles both SegWit and legacy inputs.
     * @param format Output format, either "raw" (default) or "txid".
     * @returns Serialized transaction as Uint8Array.
     * @throws If any input lacks its associated signing key.
     */
    build(format = "raw") {
        this.validateSigning();
        let witnessData = new buffer_1.ByteBuffer();
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(this.version, 32)); // version
        if (this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])); //"00" + "01";
        // number of inputs
        hexTransaction.append((0, utils_1.numberToVarint)(this.inputs.length));
        this.inputs.forEach(input => {
            var _a;
            hexTransaction.append((0, utils_1.hexToBytes)(input.txid).reverse()); // txid
            hexTransaction.append((0, utils_1.numberToHexLE)(input.vout, 32)); // index output (vout)
            if (this.isSegwitInput(input)) {
                witnessData.append(this.buildWitness(input));
                hexTransaction.append(new Uint8Array([0])); // script sig in witness area // P2WPKH 
            }
            else {
                let scriptSig = this.buildScriptSig(input);
                hexTransaction.append((0, utils_1.numberToHexLE)(scriptSig.length, 8));
                hexTransaction.append(scriptSig);
                witnessData.append(new Uint8Array([0])); // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse()); // 0xfffffffd
        });
        hexTransaction.append((0, utils_1.numberToVarint)(this.outputs.length)); // number of outputs
        hexTransaction.append(this.outputsRaw(this.outputs)); // amount+scriptpubkey
        if (this.isSegwit() && format != "txid")
            hexTransaction.append(witnessData.raw());
        hexTransaction.append((0, utils_1.numberToHexLE)(this.locktime, 32)); // locktime
        return hexTransaction.raw();
    }
    /**
     * Generates the witness data for a SegWit input.
     * @param input The input to generate witness for.
     * @returns Serialized witness field.
     * @throws If the input has no associated signing key.
     */
    buildWitness(input) {
        const pairkey = this.signingKeys.get(this.getkey(input));
        if (!pairkey)
            throw new Error("Transaction not signed, please sign the transaction");
        return super.generateWitness(input, {
            version: this.version,
            locktime: this.locktime,
            inputs: this.inputs,
            outputs: this.outputs,
            pairkey: pairkey
        });
    }
    /**
     * Generates the legacy scriptSig for a non-SegWit input.
     * @param input The input to generate the scriptSig for.
     * @returns Serialized scriptSig.
     * @throws If the input has no associated signing key.
     */
    buildScriptSig(input) {
        const pairkey = this.signingKeys.get(this.getkey(input));
        if (!pairkey)
            throw new Error("Transaction not signed, please sign the transaction");
        return super.generateScriptSig(input, {
            version: this.version,
            locktime: this.locktime,
            inputs: this.inputs,
            outputs: this.outputs,
            pairkey
        });
    }
    /**
     * Clears all inputs, outputs, cached data, and signing keys.
     */
    clear() {
        this.inputs = [];
        this.outputs = [];
        this.signingKeys.clear();
        this.cachedata.clear();
    }
    /**
     * Generates a unique key for the signingKeys map based on txid and vout.
     * @param input The input to derive the key from.
     * @returns A string in the format "txid:vout".
     */
    getkey(input) {
        return `${input.txid}:${input.vout}`;
    }
    /**
     * Validates that all inputs have an associated signing key.
     * @throws If any input is missing its corresponding key.
     */
    validateSigning() {
        for (const input of this.inputs) {
            if (!this.signingKeys.has(this.getkey(input)))
                throw new Error(`Missing signing key for input ${JSON.stringify(input)}`);
        }
    }
}
exports.HDTransactionBase = HDTransactionBase;
//# sourceMappingURL=hdtxbase.js.map