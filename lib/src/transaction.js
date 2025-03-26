"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const txbase_1 = require("./base/txbase");
const opcodes_1 = require("./constants/opcodes");
const utils_1 = require("./utils");
const txutils_1 = require("./utils/txutils");
class Transaction extends txbase_1.BaseTransaction {
    constructor(pairkey, options) {
        var _a, _b;
        super(pairkey);
        this.version = (_a = options === null || options === void 0 ? void 0 : options.version) !== null && _a !== void 0 ? _a : 2;
        this.locktime = (_b = options === null || options === void 0 ? void 0 : options.locktime) !== null && _b !== void 0 ? _b : 0;
    }
    build(format = "raw") {
        let witnessData = "";
        let hexTransaction = String((0, utils_1.numberToHexLE)(this.version, 32, "hex")); // version
        if (this.isSegwit() && format != "txid") // Marker and Flag for SegWit transactions
            hexTransaction += (0, utils_1.bytesToHex)(new Uint8Array([0x00, 0x01])); //"00" + "01";
        hexTransaction += String((0, utils_1.numberToVarTnt)(this.inputs.length, "hex")); // number of inputs
        this.inputs.forEach(input => {
            var _a;
            hexTransaction += (0, utils_1.reverseEndian)(input.txid); // txid
            hexTransaction += String((0, utils_1.numberToHexLE)(input.vout, 32, "hex")); // index output (vout)
            if (this.isSegwitInput(input)) {
                witnessData += String(this.generateWitness(input, "hex"));
                hexTransaction += "00"; // script sig in witness area // P2WPKH 
            }
            else {
                let scriptSig = String(this.generateScriptSig(input, "hex"));
                let scriptSigLength = String((0, utils_1.numberToHexLE)((0, utils_1.getBytesCount)(scriptSig), 8, "hex"));
                hexTransaction += scriptSigLength.concat(scriptSig);
                witnessData += "00"; // no witness, only scriptSig
            }
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction += (_a = input.sequence) !== null && _a !== void 0 ? _a : (0, utils_1.reverseEndian)("fffffffd"); // 0xfffffffd
        });
        hexTransaction += String((0, utils_1.numberToVarTnt)(this.outputs.length, "hex")); // number of outputs
        hexTransaction += this.outputsRaw(); // amount+scriptpubkey
        if (this.isSegwit() && format != "txid")
            hexTransaction += witnessData;
        hexTransaction += String((0, utils_1.numberToHexLE)(this.locktime, 32, "hex")); // locktime
        return hexTransaction;
    }
    getTxid() {
        let hexTransaction = this.build("txid");
        let hash = String((0, utils_1.hash256)(hexTransaction));
        return String((0, utils_1.reverseEndian)(hash));
    }
    generateScriptSig(inputSig, resultType) {
        if (this.cachedata[inputSig.txid])
            return String(this.cachedata[inputSig.txid]);
        let hexTransaction = String((0, utils_1.numberToHexLE)(this.version, 32, "hex")); // version
        hexTransaction += String((0, utils_1.numberToVarTnt)(this.inputs.length, "hex")); // number of inputs
        this.inputs.forEach(input => {
            var _a;
            hexTransaction += String((0, utils_1.reverseEndian)(input.txid)); // txid
            hexTransaction += String((0, utils_1.numberToHexLE)(input.vout, 32, "hex")); // index output (vout)
            if (input.txid === inputSig.txid) {
                let scriptLength = (0, utils_1.hexToBytes)(input.scriptPubKey).length;
                hexTransaction += String((0, utils_1.numberToVarTnt)(scriptLength, "hex"));
                hexTransaction += input.scriptPubKey;
            }
            else
                hexTransaction += "00"; // length 0x00 to sign
            // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
            hexTransaction += (_a = input.sequence) !== null && _a !== void 0 ? _a : (0, utils_1.reverseEndian)("fffffffd");
        });
        hexTransaction += String((0, utils_1.numberToVarTnt)(this.outputs.length, "hex")); // number of outputs
        hexTransaction += this.outputsRaw();
        hexTransaction += String((0, utils_1.numberToHexLE)(this.locktime, 32, "hex")); // locktime
        hexTransaction += String((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32, "hex"));
        let sigHash = String((0, utils_1.hash256)(hexTransaction)); // hash256 -> sha256(sha256(content))
        let signature = String(this.pairKey.signDER(sigHash));
        signature += String((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 8, "hex"));
        let signatureLength = String((0, utils_1.numberToHex)((0, utils_1.getBytesCount)(signature), 8, "hex"));
        let publicKey = this.pairKey.getPublicKeyCompressed("hex");
        let publicKeyLength = String((0, utils_1.numberToHex)((0, utils_1.getBytesCount)(publicKey), 8, "hex"));
        let scriptSig = signatureLength.concat(signature, publicKeyLength, publicKey);
        this.cachedata[inputSig.txid] = scriptSig;
        if (resultType == "hex")
            return scriptSig;
        return (0, utils_1.hexToBytes)(scriptSig);
    }
    generateWitness(input, resultType = "hex") {
        var _a;
        if (this.cachedata[input.txid])
            return String(this.cachedata[input.txid]);
        let hexTransaction = String((0, utils_1.numberToHexLE)(this.version, 32, "hex")); // version
        // hashPrevouts
        let prevouts = this.inputs.map(input => {
            let vout = String((0, utils_1.numberToHexLE)(input.vout, 32, "hex")); // index output (vout)
            let txid = String((0, utils_1.reverseEndian)(input.txid)); // txid
            return txid.concat(vout);
        }).join("");
        let hashPrevouts = (0, utils_1.hash256)(prevouts);
        hexTransaction += hashPrevouts;
        // hashSequence
        let sequence = this.inputs.map(input => { var _a; return (_a = input.sequence) !== null && _a !== void 0 ? _a : (0, utils_1.reverseEndian)("fffffffd"); }).join("");
        let hashSequence = (0, utils_1.hash256)(sequence);
        hexTransaction += hashSequence;
        // out point 
        hexTransaction += String((0, utils_1.reverseEndian)(input.txid));
        hexTransaction += String((0, utils_1.numberToHexLE)(input.vout, 32, "hex"));
        // script code
        let scriptCode = (0, txutils_1.scriptPubkeyToScriptCode)(input.scriptPubKey);
        hexTransaction += scriptCode;
        // amount
        hexTransaction += String((0, utils_1.numberToHexLE)(input.value, 64, "hex"));
        // sequence
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        hexTransaction += (_a = input.sequence) !== null && _a !== void 0 ? _a : (0, utils_1.reverseEndian)("fffffffd");
        // hashOutputs
        let hashOutputs = (0, utils_1.hash256)(this.outputsRaw());
        hexTransaction += hashOutputs;
        hexTransaction += String((0, utils_1.numberToHexLE)(this.locktime, 32, "hex")); // locktime
        hexTransaction += String((0, utils_1.numberToHexLE)(opcodes_1.OP_CODES.SIGHASH_ALL, 32, "hex")); // sighash
        let sigHash = String((0, utils_1.hash256)(hexTransaction)); // hash256 -> sha256(sha256(content))
        let signature = String(this.pairKey.signDER(sigHash));
        signature += String((0, utils_1.numberToHex)(opcodes_1.OP_CODES.SIGHASH_ALL, 8, "hex"));
        let signatureLength = String((0, utils_1.numberToVarTnt)((0, utils_1.getBytesCount)(signature), "hex"));
        let publicKey = this.pairKey.getPublicKeyCompressed("hex");
        let publicKeyLength = String((0, utils_1.numberToVarTnt)((0, utils_1.getBytesCount)(publicKey), "hex"));
        let itemCount = String((0, utils_1.numberToHex)(2, 8, "hex")); // 2 items(signature & pubkey) 0x02
        let scriptSig = itemCount.concat(signatureLength, signature, publicKeyLength, publicKey);
        this.cachedata[input.txid] = scriptSig;
        if (resultType == "hex")
            return scriptSig;
        return (0, utils_1.hexToBytes)(scriptSig);
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
            let witness = String(this.generateWitness(input));
            return sum + (0, utils_1.getBytesCount)(witness);
        }, 0);
        // discount the size of the witness fields and multiply by 4
        let transactionSize = (0, utils_1.getBytesCount)(hexTransaction);
        transactionSize = (transactionSize - (witnessSize + witnessMK)) * 4;
        return transactionSize;
    }
    // docs https://learnmeabitcoin.com/technical/transaction/size/
    vBytes() {
        return this.weight() / 4;
    }
    clear() {
        this.inputs = [];
        this.outputs = [];
        this.cachedata = {};
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=transaction.js.map