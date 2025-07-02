"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const txbase_1 = require("./base/txbase");
const opcodes_1 = require("./constants/opcodes");
const utils_1 = require("./utils");
const txutils_1 = require("./utils/txutils");
const buffer_1 = require("./utils/buffer");
class Transaction extends txbase_1.BaseTransaction {
    constructor(pairkey, options) {
        var _a, _b;
        super(pairkey);
        this.version = (_a = options === null || options === void 0 ? void 0 : options.version) !== null && _a !== void 0 ? _a : 2;
        this.locktime = (_b = options === null || options === void 0 ? void 0 : options.locktime) !== null && _b !== void 0 ? _b : 0;
        this.whoPayTheFee = options === null || options === void 0 ? void 0 : options.whoPayTheFee;
        this.fee = options === null || options === void 0 ? void 0 : options.fee;
    }
    getFeeSats() {
        var _a;
        return Math.ceil(this.vBytes() * ((_a = this.fee) !== null && _a !== void 0 ? _a : 1));
    }
    resolveFee() {
        var _a, _b;
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
    build(format = "raw") {
        let witnessData = new buffer_1.ByteBuffer();
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(this.version, 32)); // version
        if (this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction.append(new Uint8Array([0x00, 0x01])); //"00" + "01";
        // number of inputs
        hexTransaction.append((0, utils_1.numberToVarTnt)(this.inputs.length));
        this.inputs.forEach(input => {
            var _a;
            hexTransaction.append((0, utils_1.hexToBytes)(input.txid).reverse()); // txid
            hexTransaction.append((0, utils_1.numberToHexLE)(input.vout, 32)); // index output (vout)
            if (this.isSegwitInput(input)) {
                witnessData.append(this.generateWitness(input));
                hexTransaction.append(new Uint8Array([0])); // script sig in witness area // P2WPKH 
            }
            else {
                let scriptSig = this.generateScriptSig(input);
                hexTransaction.append((0, utils_1.numberToHexLE)(scriptSig.length, 8));
                hexTransaction.append(scriptSig);
                witnessData.append(new Uint8Array([0])); // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse()); // 0xfffffffd
        });
        hexTransaction.append((0, utils_1.numberToVarTnt)(this.outputs.length)); // number of outputs
        hexTransaction.append(this.outputsRaw()); // amount+scriptpubkey
        if (this.isSegwit() && format != "txid")
            hexTransaction.append(witnessData.raw());
        hexTransaction.append((0, utils_1.numberToHexLE)(this.locktime, 32)); // locktime
        return hexTransaction.raw();
    }
    getTxid() {
        let hexTransaction = this.build("txid");
        let txid = (0, utils_1.hash256)(hexTransaction).reverse();
        return (0, utils_1.bytesToHex)(txid);
    }
    generateScriptSig(inputSig) {
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(this.version, 32)); // version
        hexTransaction.append((0, utils_1.numberToVarTnt)(this.inputs.length)); // number of inputs
        this.inputs.forEach(input => {
            var _a;
            hexTransaction.append((0, utils_1.hexToBytes)(input.txid).reverse()); // txid
            hexTransaction.append((0, utils_1.numberToHexLE)(input.vout, 32)); // index output (vout)
            if (input.txid === inputSig.txid) {
                let script = (0, utils_1.hexToBytes)(input.scriptPubKey);
                hexTransaction.append((0, utils_1.numberToVarTnt)(script.length));
                hexTransaction.append(script);
            }
            else
                hexTransaction.append(new Uint8Array([0])); // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction.append((0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse());
        });
        hexTransaction.append((0, utils_1.numberToVarTnt)(this.outputs.length)); // number of outputs
        hexTransaction.append(this.outputsRaw());
        hexTransaction.append((0, utils_1.numberToHexLE)(this.locktime, 32)); // locktime
        hexTransaction.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32));
        let sigHash = (0, utils_1.hash256)(hexTransaction.raw()); // hash256 -> sha256(sha256(content))
        let scriptSig = new buffer_1.ByteBuffer(this.pairKey.signDER(sigHash));
        scriptSig.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 8));
        scriptSig.prepend((0, utils_1.numberToHex)(scriptSig.length, 8));
        let publicKey = this.pairKey.getPublicKey();
        scriptSig.append((0, utils_1.numberToHex)(publicKey.length, 8));
        scriptSig.append(publicKey);
        return scriptSig.raw();
    }
    generateWitness(input) {
        var _a;
        let hexTransaction = new buffer_1.ByteBuffer((0, utils_1.numberToHexLE)(this.version, 32)); // version
        // hashPrevouts
        let prevouts = this.inputs.map(input => {
            let build = new buffer_1.ByteBuffer((0, utils_1.hexToBytes)(input.txid).reverse());
            build.append((0, utils_1.numberToHexLE)(input.vout, 32));
            return build.raw();
        });
        let hashPrevouts = (0, utils_1.hash256)(buffer_1.ByteBuffer.merge(prevouts));
        hexTransaction.append(hashPrevouts);
        // hashSequence
        let sequence = this.inputs.map(input => { var _a; return (0, utils_1.hexToBytes)((_a = input.sequence) !== null && _a !== void 0 ? _a : "fffffffd").reverse(); });
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
        let hashOutputs = (0, utils_1.hash256)(this.outputsRaw());
        hexTransaction.append(hashOutputs);
        hexTransaction.append((0, utils_1.numberToHexLE)(this.locktime, 32)); // locktime
        hexTransaction.append((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32)); // sighash
        let sigHash = (0, utils_1.hash256)(hexTransaction.raw()); // hash256 -> sha256(sha256(content))
        let scriptSig = new buffer_1.ByteBuffer(this.pairKey.signDER(sigHash));
        scriptSig.append((0, utils_1.numberToHex)(opcodes_1.OP_CODES.SIGHASH_ALL, 8));
        scriptSig.prepend((0, utils_1.numberToVarTnt)(scriptSig.length));
        let publicKey = this.pairKey.getPublicKey();
        scriptSig.append((0, utils_1.numberToVarTnt)(publicKey.length));
        scriptSig.append(publicKey);
        scriptSig.prepend((0, utils_1.numberToHex)(2, 8)); // 2 items(signature & pubkey) 0x02
        return scriptSig.raw();
    }
    isSegwit() {
        return this.inputs.some(this.isSegwitInput);
    }
    isSegwitInput(input) {
        const bytes = (0, utils_1.hexToBytes)(input.scriptPubKey);
        return ((bytes.length === 22 && bytes[0] == 0x00 && bytes[1] == 0x14) || // P2WPKH
            (bytes.length === 34 && bytes[0] == 0x00 && bytes[1] == 0x20)); // P2WSH
    }
    // docs https://learnmeabitcoin.com/technical/transaction/size/
    weight() {
        // witness marker and flag * 1
        let witnessMK = 0; // 2 bytes of marker and flag 0x00+0x01 = 2 bytes * 1
        if (this.isSegwit())
            witnessMK = 2;
        let hexTransaction = this.build();
        let witnessInputs = this.inputs.filter(this.isSegwitInput);
        // witness size * 1
        let witnessSize = witnessInputs.reduce((sum, input) => {
            let witness = this.generateWitness(input);
            return sum + witness.length;
        }, 0);
        // discount the size of the witness fields and multiply by 4
        let transactionSize = hexTransaction.length;
        transactionSize = (transactionSize - (witnessSize + witnessMK)) * 4;
        transactionSize += (witnessSize + witnessMK); // * 1
        return Math.ceil(transactionSize);
    }
    // docs https://learnmeabitcoin.com/technical/transaction/size/
    vBytes() {
        return Math.ceil(this.weight() / 4);
    }
    clear() {
        this.inputs = [];
        this.outputs = [];
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map