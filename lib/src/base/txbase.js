"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTransaction = void 0;
const utils_1 = require("../utils");
const txutils_1 = require("../utils/txutils");
class BaseTransaction {
    constructor(pairKey) {
        this.version = 2;
        this.locktime = 0;
        this.cachedata = {};
        this.inputs = [];
        this.outputs = [];
        this.pairKey = pairKey;
    }
    addInput(input) {
        if (input.txid.length < 10)
            throw new Error("Expected txid value");
        else if (!input.scriptPubKey)
            throw new Error("Expected scriptPubKey");
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if (!input.sequence)
            input.sequence = "fffffffd";
        this.inputs.push(input);
        this.cachedata = {};
    }
    addOutput(output) {
        if (output.address.length <= 10)
            throw new Error("Expected address value");
        if (output.amount <= 0)
            throw new Error("Expected a valid amount");
        this.outputs.push(output);
    }
    outputsRaw() {
        return this.outputs.map(output => {
            let txoutput = String((0, utils_1.numberToHexLE)(output.amount, 64, "hex"));
            let scriptPubKey = (0, txutils_1.addressToScriptPubKey)(output.address);
            txoutput += String((0, utils_1.numberToVarTnt)(scriptPubKey.length, "hex"));
            txoutput += (0, utils_1.bytesToHex)(scriptPubKey);
            return txoutput;
        }).join("");
    }
}
exports.BaseTransaction = BaseTransaction;
//# sourceMappingURL=txbase.js.map