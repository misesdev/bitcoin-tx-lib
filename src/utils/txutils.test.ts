import { addressToScriptPubKey, pubkeyToScriptCode, scriptPubkeyToScriptCode } from "./txutils"
import { bytesToHex } from "./index"

describe("addressToScriptPubKey", () => {

    test("P2PKH testnet address → 25-byte P2PKH scriptPubKey", () => {
        const address = "mzzD7VraX6Vt5XPCZqRDsBkNey9wCPks6u"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toBe("76a914d591fd84cf51bb8b325c5b11025ea02d9ae9a85d88ac")
    })

    test("P2PKH mainnet address (starts with 1) → valid P2PKH scriptPubKey", () => {
        // Satoshi genesis address
        const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
        const script = addressToScriptPubKey(address)
        expect(script.length).toBe(25)
        expect(script[0]).toBe(0x76)  // OP_DUP
        expect(script[1]).toBe(0xa9)  // OP_HASH160
        expect(script[2]).toBe(0x14)  // push 20 bytes
        expect(script[23]).toBe(0x88) // OP_EQUALVERIFY
        expect(script[24]).toBe(0xac) // OP_CHECKSIG
    })

    test("P2WSH testnet address (32-byte hash) → 34-byte scriptPubKey", () => {
        const address = "tb1qna02q87qpy9q2aqxcff2ue8pvl2m6037ravplcvy2rark5g3xc3svxy4ek"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toBe("00209f5ea01fc0090a057406c252ae64e167d5bd3e3e1f581fe18450fa3b51113623")
    })

    test("P2WPKH testnet address (20-byte hash) → 22-byte scriptPubKey", () => {
        const address = "tb1qrzxautduewud394haxv085exvcwm9hcw72ugth"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toBe("0014188dde2dbccbb8d896b7e998f3d326661db2df0e")
    })

    test("P2WPKH scriptPubKey structure: OP_0 + push-20 + hash", () => {
        const address = "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj"
        const script = addressToScriptPubKey(address)
        expect(script.length).toBe(22)
        expect(script[0]).toBe(0x00) // OP_0
        expect(script[1]).toBe(0x14) // push 20 bytes
        expect(script.slice(2).length).toBe(20)
    })

    test("P2SH address is not supported — throws", () => {
        expect(() => addressToScriptPubKey("2NBFNJTktNa7GZusGbDbGKRZTxdK9VVez3n")).toThrow()
    })

    test("completely invalid address throws", () => {
        expect(() => addressToScriptPubKey("abc123")).toThrow("not supported format address")
    })

    test("empty string throws", () => {
        expect(() => addressToScriptPubKey("")).toThrow()
    })
})

describe("pubkeyToScriptCode", () => {
    test("known public key → correct P2WPKH scriptCode (hex)", () => {
        const publicKey = "0333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f"
        expect(pubkeyToScriptCode(publicKey)).toBe("1976a914a8439c50793b033df810de257b313144a8f7edc988ac")
    })

    test("output length prefix (first byte) encodes the script length", () => {
        const publicKey = "0333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f"
        const scriptCode = pubkeyToScriptCode(publicKey)
        // "19" = 25 decimal = standard P2PKH script length
        expect(scriptCode.substring(0, 2)).toBe("19")
    })
})

describe("scriptPubkeyToScriptCode", () => {
    test("P2WPKH scriptPubkey → produces P2PKH scriptCode with length prefix", () => {
        const result = scriptPubkeyToScriptCode("0014a8439c50793b033df810de257b313144a8f7edc9")
        expect(bytesToHex(result)).toBe("1976a914a8439c50793b033df810de257b313144a8f7edc988ac")
    })

    test("P2WPKH output: first byte is 0x19 (25 = length of inner P2PKH script)", () => {
        const result = scriptPubkeyToScriptCode("0014a8439c50793b033df810de257b313144a8f7edc9")
        expect(result[0]).toBe(0x19)
    })

    test("P2WSH scriptPubkey (OP_0 + 32-byte hash) → passes through with length prefix", () => {
        // P2WSH: 0x00 0x20 <32 bytes>
        const p2wshHex = "0020" + "ab".repeat(32)
        const result = scriptPubkeyToScriptCode(p2wshHex)
        // First byte = total script length = 34 (2 + 32)
        expect(result[0]).toBe(34)
        // Remaining bytes = original scriptPubkey
        expect(bytesToHex(result.slice(1))).toBe(p2wshHex)
    })

    test("P2PKH scriptPubkey passed to scriptPubkeyToScriptCode throws (not a SegWit script)", () => {
        // P2PKH: 76 a9 14 <20 bytes> 88 ac — does not start with OP_0
        const p2pkhHex = "76a914" + "ab".repeat(20) + "88ac"
        expect(() => scriptPubkeyToScriptCode(p2pkhHex)).toThrow("scriptPubkey no segwit")
    })

    test("random/unknown script type throws", () => {
        expect(() => scriptPubkeyToScriptCode("deadbeef")).toThrow("scriptPubkey no segwit")
    })
})
