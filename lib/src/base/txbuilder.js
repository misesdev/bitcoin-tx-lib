"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionBuilder = void 0;
const opcodes_1 = require("../constants/opcodes");
const utils_1 = require("../utils");
const address_1 = require("../utils/address");
const buffer_1 = require("../utils/buffer");
const txutils_1 = require("../utils/txutils");
/**
 * Base class for building and signing Bitcoin transactions (both Legacy and SegWit).
 */
class TransactionBuilder {
    /**
     * Determines if any input is a SegWit (P2WPKH or P2WSH) input.
     * @param inputs List of transaction inputs.
     * @returns True if at least one input is SegWit.
     */
    isSegwit(inputs) {
        return inputs.some(this.isSegwitInput);
    }
    /**
     * Checks if a specific input is a SegWit input (P2WPKH or P2WSH).
     * @param input The input to check.
     * @returns True if input is SegWit.
     */
    isSegwitInput(input) {
        const bytes = (0, utils_1.hexToBytes)(input.scriptPubKey);
        return ((bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14) || // P2WPKH
            (bytes.length === 34 && bytes[0] == 0x00 && bytes[1] == 0x20)); // P2WSH
    }
    /**
     * Builds and signs the entire transaction.
     * @param params Signing parameters including inputs, outputs, key, version and locktime.
     * @param format Whether to generate a "raw" or "txid" version.
     * @returns Raw transaction bytes.
     */
    buildAndSign(params, format = "raw") {
        let witnessData = new buffer_1.ByteBuffer();
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(params.version, 32)); // version
        if (this.isSegwit(params.inputs) && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])); //"00" + "01";
        // number of inputs
        hexTransaction.append((0, utils_1.numberToVarint)(params.inputs.length));
        params.inputs.forEach(input => {
            var _a;
            hexTransaction.append((0, utils_1.hexToBytes)(input.txid).reverse()); // txid
            hexTransaction.append((0, utils_1.numberToHexLE)(input.vout, 32)); // index output (vout)
            if (this.isSegwitInput(input)) {
                witnessData.append(this.generateWitness(input, params));
                hexTransaction.append(new Uint8Array([0])); // script sig in witness area // P2WPKH 
            }
            else {
                witnessData.append(new Uint8Array([0])); // no witness, only scriptSig
                let scriptSig = this.generateScriptSig(input, params);
                hexTransaction.append((0, utils_1.numberToVarint)(scriptSig.length));
                hexTransaction.append(scriptSig);
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse()); // 0xfffffffd
        });
        hexTransaction.append((0, utils_1.numberToVarint)(params.outputs.length)); // number of outputs
        hexTransaction.append(this.outputsRaw(params.outputs)); // amount+scriptpubkey
        if (this.isSegwit(params.inputs) && format != "txid")
            hexTransaction.append(witnessData.raw());
        hexTransaction.append((0, utils_1.numberToHexLE)(params.locktime, 32)); // locktime
        return hexTransaction.raw();
    }
    /**
     * Generates the `scriptSig` for a legacy (non-SegWit) P2PKH input.
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The generated `scriptSig` as a byte array.
     */
    generateScriptSig(input, { inputs, outputs, pairkey, locktime, version }) {
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(version, 32)); // version
        hexTransaction.append((0, utils_1.numberToVarint)(inputs.length)); // number of inputs
        inputs.forEach(txin => {
            var _a;
            hexTransaction.append((0, utils_1.hexToBytes)(txin.txid).reverse()); // txid
            hexTransaction.append((0, utils_1.numberToHexLE)(txin.vout, 32)); // index output (vout)
            if (txin.txid === input.txid) {
                let script = (0, utils_1.hexToBytes)(txin.scriptPubKey);
                hexTransaction.append((0, utils_1.numberToVarint)(script.length));
                hexTransaction.append(script);
            }
            else
                hexTransaction.append(new Uint8Array([0])); // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse());
        });
        hexTransaction.append((0, utils_1.numberToVarint)(outputs.length)); // number of outputs
        hexTransaction.append(this.outputsRaw(outputs));
        hexTransaction.append((0, utils_1.numberToHexLE)(locktime, 32)); // locktime
        hexTransaction.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32));
        let sigHash = (0, utils_1.hash256)(hexTransaction.raw()); // hash256 -> sha256(sha256(content))
        let scriptSig = new buffer_1.ByteBuffer(pairkey.signDER(sigHash));
        scriptSig.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 8));
        scriptSig.prepend((0, utils_1.numberToHex)(scriptSig.length, 8));
        let publicKey = pairkey.getPublicKey();
        scriptSig.append((0, utils_1.numberToHex)(publicKey.length, 8));
        scriptSig.append(publicKey);
        return scriptSig.raw();
    }
    /**
     * Generates the witness data for a SegWit input (P2WPKH).
     * @param input The input to sign.
     * @param params All transaction signing context.
     * @returns The witness field as a byte array.
     */
    generateWitness(input, { inputs, outputs, pairkey, locktime, version }) {
        var _a;
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(version, 32)); // version
        // hashPrevouts
        let prevouts = inputs.map(input => {
            let build = new buffer_1.ByteBuffer((0, utils_1.hexToBytes)(input.txid).reverse());
            build.append((0, utils_1.numberToHexLE)(input.vout, 32));
            return build.raw();
        });
        let hashPrevouts = (0, utils_1.hash256)(buffer_1.ByteBuffer.merge(prevouts));
        hexTransaction.append(hashPrevouts);
        // hashSequence
        let sequence = inputs.map(input => { var _a; return (0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse(); });
        let hashSequence = (0, utils_1.hash256)(buffer_1.ByteBuffer.merge(sequence));
        hexTransaction.append(hashSequence);
        // out point 
        hexTransaction.append((0, utils_1.hexToBytes)(input.txid).reverse());
        hexTransaction.append((0, utils_1.numberToHexLE)(input.vout, 32));
        // script code
        let scriptCode = (0, txutils_1.scriptPubkeyToScriptCode)(input.scriptPubKey);
        hexTransaction.append(scriptCode);
        // amount
        hexTransaction.append((0, utils_1.numberToHexLE)(input.value, 64));
        // sequence
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse());
        // hashOutputs
        let hashOutputs = (0, utils_1.hash256)(this.outputsRaw(outputs));
        hexTransaction.append(hashOutputs);
        hexTransaction.append((0, utils_1.numberToHexLE)(locktime, 32)); // locktime
        hexTransaction.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32)); // sighash
        let sigHash = (0, utils_1.hash256)(hexTransaction.raw()); // hash256 -> sha256(sha256(content))
        let scriptSig = new buffer_1.ByteBuffer(pairkey.signDER(sigHash));
        scriptSig.append((0, utils_1.numberToHex)(opcodes_1.OP_CODES.SIGHASH_ALL, 8));
        scriptSig.prepend((0, utils_1.numberToVarint)(scriptSig.length));
        let publicKey = pairkey.getPublicKey();
        scriptSig.append((0, utils_1.numberToVarint)(publicKey.length));
        scriptSig.append(publicKey);
        scriptSig.prepend((0, utils_1.numberToHex)(2, 8)); // 2 items(signature & pubkey) 0x02
        return scriptSig.raw();
    }
    /**
     * Serializes transaction outputs into their raw binary format.
     * @param outputs List of transaction outputs.
     * @returns Byte array of all outputs serialized.
     */
    outputsRaw(outputs) {
        const rows = outputs.map(output => {
            let txoutput = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(output.amount, 64));
            let scriptPubKey = (0, txutils_1.addressToScriptPubKey)(output.address);
            txoutput.append((0, utils_1.numberToVarint)(scriptPubKey.length));
            txoutput.append(scriptPubKey);
            return txoutput.raw();
        }).flat();
        return buffer_1.ByteBuffer.merge(rows);
    }
    /**
     * Validates a transaction input.
     * Throws if txid is invalid, scriptPubKey is missing, or the txid is duplicated.
     * @param input The input to validate.
     * @param inputs The current list of inputs.
     */
    validateInput(input, inputs) {
        if ((0, utils_1.getBytesCount)(input.txid) != 32)
            throw new Error("Expected a valid txid");
        else if (!input.scriptPubKey)
            throw new Error("Expected scriptPubKey");
        if (inputs.some(i => i.txid == input.txid))
            throw new Error("An input with this txid has already been added");
    }
    /**
     * Validates a transaction output.
     * Throws if amount is non-positive, address is invalid, or address is duplicated.
     * @param output The output to validate.
     * @param outputs The current list of outputs.
     */
    validateOutput(output, outputs) {
        if (output.amount <= 0)
            throw new Error("Expected a valid amount");
        if (!address_1.Address.isValid(output.address))
            throw new Error("Expected a valid address to output");
        if (outputs.some(o => o.address == output.address))
            throw new Error("An output with this address has already been added");
    }
}
exports.TransactionBuilder = TransactionBuilder;
//# sourceMappingURL=txbuilder.js.map