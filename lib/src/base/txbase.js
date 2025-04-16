"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTransaction = void 0;
const utils_1 = require("../utils");
const address_1 = require("../utils/address");
const txutils_1 = require("../utils/txutils");
class BaseTransaction {
    constructor(pairKey) {
        this.version = 2;
        this.locktime = 0;
        this.inputs = [];
        this.outputs = [];
        this.cachedata = {};
        this.pairKey = pairKey;
    }
    addInput(input) {
        if (this.inputs.some(i => i.txid == input.txid))
            throw new Error("An input with this txid has already been added");
        if ((0, utils_1.getBytesCount)(input.txid) != 32)
            throw new Error("Expected a valid txid");
        else if (!input.scriptPubKey)
            throw new Error("Expected scriptPubKey");
        // 0xfffffffd Replace By Fee (RBF) enabled BIP 125
        if (!input.sequence)
            input.sequence = "fffffffd";
        this.inputs.push(input);
    }
    addOutput(output) {
        if (this.outputs.some(o => o.address == output.address))
            throw new Error("An output with this address has already been added");
        if (!address_1.Address.isValid(output.address))
            throw new Error("Expected a valid address to output");
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