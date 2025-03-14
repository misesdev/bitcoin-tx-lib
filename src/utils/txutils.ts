import { bech32 } from "bech32"
import { hexToBytes, mergeUint8Arrays } from "."
import { Base58 } from "../base/base58"

export function addressToScriptPubKey(address: string): Uint8Array {
    if(["1", "m", "n"].includes(address[0])) {
        // P2PKH Legacy
        const decoded = hexToBytes(Base58.decode(address))
        const hash = decoded.slice(1, -4) // remove the prefix and checksum
        const prefixScript = new Uint8Array([0x76, 0xa9, hash.length])
        //return mergeUint8Arrays(hexToBytes("76a914"), hash, hexToBytes("88ac"))
        return mergeUint8Arrays(prefixScript, hash, hexToBytes("88ac"))
    } else if (["2", "3"].includes(address[0])) {
        // P2SH Legacy
        const decoded = hexToBytes(Base58.decode(address))
        const hash = decoded.slice(1, -4) // remove the prefix and checksum
        const prefixScript = new Uint8Array([0xa9, hash.length])
        //return mergeUint8Arrays(hexToBytes("a914"), hash, hexToBytes("87"))
        return mergeUint8Arrays(prefixScript, hash, hexToBytes("87"))
    } else if (["tb1", "bc1"].includes(address.substring(0,3))) {
        // SegWit (P2WPKH, P2WSH)
        const data = bech32.decode(address)
        const hash = new Uint8Array(bech32.fromWords(data.words.slice(1)))
        if(hash) {
            const prefixScript = new Uint8Array([0x00, hash.length])
            return mergeUint8Arrays(prefixScript, hash)
        }
        throw new Error("Invalid bech32 format address")
    }
    throw new Error("not supported format address")
}
