"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bech32 = void 0;
const utils_1 = require("../utils");
class Bech32 {
    constructor(options = {}) {
        var _a;
        this.version = 0;
        this.network = "mainnet";
        this.encoding = "bech32";
        this.encodings = { BECH32: "bech32", BECH32M: "bech32m" };
        this.chars = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
        this.generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
        if (options === null || options === void 0 ? void 0 : options.network)
            this.network = options.network;
        if (options === null || options === void 0 ? void 0 : options.version) {
            this.version = options.version;
            this.encoding = options.version > 0 ? "bech32m" : "bech32";
        }
        this.publicKey = (_a = options.publicKey) !== null && _a !== void 0 ? _a : "";
    }
    // convert a ripemd160 hexadecimal in a bech32 hexadecimal 32 bytes
    convert(ripemd160) {
        let binary = "";
        let hexadecimal = typeof (ripemd160) == "string" ? (0, utils_1.hexToBytes)(ripemd160) : ripemd160;
        // convert the bytes in int binary 8 bits string binary
        hexadecimal.forEach(num => {
            let bits = num.toString(2);
            while (bits.length < 8)
                bits = "0" + bits;
            binary += bits;
        });
        let int5Array = [this.version];
        // breaks the string into 5-bit ints in an array
        for (let i = 0; i < binary.length; i += 5)
            int5Array.push(parseInt(binary.slice(i, i + 5), 2));
        // convert int5 into 1-byte hexadecimal and return the string of concatenating bytes
        return int5Array;
    }
    getAddress() {
        let sha2 = (0, utils_1.sha256)(this.publicKey);
        let ripemd = (0, utils_1.ripemd160)(sha2);
        let hex = this.convert(ripemd);
        return this.encode(hex);
    }
    getEncodingConst(enc) {
        if (enc == this.encodings.BECH32) {
            return 1;
        }
        else if (enc == this.encodings.BECH32M) {
            return 0x2bc830a3;
        }
        return 1;
    }
    polymod(values) {
        var chk = 1;
        for (var p = 0; p < values.length; ++p) {
            var top = chk >> 25;
            chk = (chk & 0x1ffffff) << 5 ^ values[p];
            for (var i = 0; i < 5; ++i) {
                if ((top >> i) & 1) {
                    chk ^= this.generator[i];
                }
            }
        }
        return chk;
    }
    hrpExpand(hrp) {
        var p;
        var ret = [];
        for (p = 0; p < hrp.length; ++p) {
            ret.push(hrp.charCodeAt(p) >> 5);
        }
        ret.push(0);
        for (p = 0; p < hrp.length; ++p) {
            ret.push(hrp.charCodeAt(p) & 31);
        }
        return ret;
    }
    verifyChecksum(data) {
        let hrp = this.network === "mainnet" ? "bc" : "tb";
        return this.polymod(this.hrpExpand(hrp).concat(data)) === this.getEncodingConst(this.encoding);
    }
    createChecksum(data) {
        let hrp = this.network === "mainnet" ? "bc" : "tb";
        var values = this.hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
        var mod = this.polymod(values) ^ this.getEncodingConst(this.encoding);
        var ret = [];
        for (var p = 0; p < 6; ++p) {
            ret.push((mod >> 5 * (5 - p)) & 31);
        }
        return ret;
    }
    encode(data) {
        let hrp = this.network === "mainnet" ? "bc" : "tb";
        let combined = data.concat(this.createChecksum(data));
        var ret = hrp + '1';
        for (let p = 0; p < combined.length; ++p) {
            ret += this.chars.charAt(combined[p]);
        }
        return ret;
    }
    decode(bechString) {
        var p;
        var has_lower = false;
        var has_upper = false;
        for (p = 0; p < bechString.length; ++p) {
            if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
                return null;
            }
            if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
                has_lower = true;
            }
            if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
                has_upper = true;
            }
        }
        if (has_lower && has_upper) {
            return null;
        }
        bechString = bechString.toLowerCase();
        var pos = bechString.lastIndexOf('1');
        if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
            return null;
        }
        // var hrp = bechString.substring(0, pos)
        var data = [];
        for (p = pos + 1; p < bechString.length; ++p) {
            var d = this.chars.indexOf(bechString.charAt(p));
            if (d === -1) {
                return null;
            }
            data.push(d);
        }
        if (!this.verifyChecksum(data)) {
            return null;
        }
        var program = data.slice(0, data.length - 6);
        var hash = new Uint8Array(program.length);
        program.forEach((num, index) => hash[index] = num);
        return hash;
    }
    getScriptPubkey(bech32Address) {
        let bytesint5 = this.decode(bech32Address);
        let int8string = "";
        bytesint5 === null || bytesint5 === void 0 ? void 0 : bytesint5.forEach((num, index) => {
            if (index > 0) { // ignore byte version
                let binary = num.toString(2);
                while (binary.length < 5)
                    binary = "0" + binary;
                int8string += binary;
            }
        });
        let int8array = new Uint8Array(int8string.length / 8);
        for (let i = 0; i < int8string.length; i += 8)
            int8array[i == 0 ? 0 : i / 8] = parseInt(int8string.slice(i, i + 8), 2);
        return (0, utils_1.bytesToHex)(int8array);
    }
}
exports.Bech32 = Bech32;
//# sourceMappingURL=bech32.js.map