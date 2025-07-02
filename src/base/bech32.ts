import { BNetwork, Bech32Options, BechEncoding, Hex } from "../types"
import { bytesToHex, hexToBytes, ripemd160, sha256 } from "../utils"

export class Bech32 {

    public publicKey: string
    public version: number = 0
    public network: BNetwork = "mainnet"
    public encoding: BechEncoding = "bech32"
    private encodings = { BECH32: "bech32", BECH32M: "bech32m" }
    private chars: string = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"
    private generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]

    public constructor(options: Bech32Options = {}) {
        if (options?.network)
            this.network = options.network
        if (options?.version) {
            this.version = options.version
            this.encoding = options.version > 0 ? "bech32m" : "bech32"
        }

        this.publicKey = options.publicKey ?? ""
    }

    // convert a ripemd160 hexadecimal in a bech32 hexadecimal 32 bytes
    public convert(ripemd160: Hex): number[] {
        let binary = ""
        let hexadecimal = typeof(ripemd160) == "string" ? hexToBytes(ripemd160) : ripemd160
        // convert the bytes in int binary 8 bits string binary
        hexadecimal.forEach(num => {
            let bits = num.toString(2)
            while(bits.length < 8)
                bits = "0" + bits
            binary += bits
        })

        let int5Array: number[] = [this.version]
        // breaks the string into 5-bit ints in an array
        for (let i = 0; i < binary.length; i += 5)
            int5Array.push(parseInt(binary.slice(i, i + 5), 2))

        // convert int5 into 1-byte hexadecimal and return the string of concatenating bytes
        return int5Array;
    }

    public getAddress(): string {

        let sha2 = sha256(hexToBytes(this.publicKey))

        let ripemd = ripemd160(sha2)

        let hex = this.convert(ripemd)

        return this.encode(hex)
    }

    private getEncodingConst(enc: BechEncoding) {
        if (enc == this.encodings.BECH32) {
            return 1
        } else if (enc == this.encodings.BECH32M) {
            return 0x2bc830a3
        }
        return 1
    }

    private polymod(values: number[]) {
        var chk = 1
        for (var p = 0; p < values.length; ++p) {
            var top = chk >> 25
            chk = (chk & 0x1ffffff) << 5 ^ values[p]
            for (var i = 0; i < 5; ++i) {
                if ((top >> i) & 1) {
                    chk ^= this.generator[i]
                }
            }
        }
        return chk
    }

    private hrpExpand(hrp: string) {
        var p
        var ret = []
        for (p = 0; p < hrp.length; ++p) {
            ret.push(hrp.charCodeAt(p) >> 5)
        }
        ret.push(0)
        for (p = 0; p < hrp.length; ++p) {
            ret.push(hrp.charCodeAt(p) & 31)
        }
        return ret
    }

    public verifyChecksum(data: number[]) {
        let hrp = this.network === "mainnet" ? "bc" : "tb"
        return this.polymod(this.hrpExpand(hrp).concat(data)) === this.getEncodingConst(this.encoding)
    }

    public createChecksum(data: number[]) {
        let hrp = this.network === "mainnet" ? "bc" : "tb"
        var values = this.hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0])
        var mod = this.polymod(values) ^ this.getEncodingConst(this.encoding)
        var ret = []
        for (var p = 0; p < 6; ++p) {
            ret.push((mod >> 5 * (5 - p)) & 31)
        }
        return ret
    }

    public encode(data: number[]) {

        let hrp = this.network === "mainnet" ? "bc" : "tb"
        let combined = data.concat(this.createChecksum(data))

        var ret = hrp + '1'
        for (let p = 0; p < combined.length; ++p) {
            ret += this.chars.charAt(combined[p])
        }
        return ret
    }

    public decode(bechString: string) {
        var p
        var has_lower = false
        var has_upper = false
        for (p = 0; p < bechString.length; ++p) {
            if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
                return null
            }
            if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
                has_lower = true
            }
            if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
                has_upper = true
            }
        }
        if (has_lower && has_upper) {
            return null
        }
        bechString = bechString.toLowerCase()
        var pos = bechString.lastIndexOf('1')
        if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
            return null
        }
        // var hrp = bechString.substring(0, pos)
        var data = []
        for (p = pos + 1; p < bechString.length; ++p) {
            var d = this.chars.indexOf(bechString.charAt(p))
            if (d === -1) {
                return null
            }
            data.push(d)
        }
        if (!this.verifyChecksum(data)) {
            return null
        }

        var program = data.slice(0, data.length - 6)

        var hash = new Uint8Array(program.length)

        program.forEach((num, index) => hash[index] = num)

        return hash
    }

    public getScriptPubkey(bech32Address: string) {
        let bytesint5 = this.decode(bech32Address)

        let int8string = ""
        bytesint5?.forEach((num, index) => {
            if(index > 0) { // ignore byte version
                let binary = num.toString(2)
                while(binary.length < 5)
                    binary = "0" + binary
                int8string += binary
            }
        })

        let int8array = new Uint8Array(int8string.length / 8)
        for(let i = 0; i < int8string.length; i += 8)
            int8array[i == 0 ? 0 : i / 8] = parseInt(int8string.slice(i, i + 8), 2)

        return bytesToHex(int8array)
    }
}
