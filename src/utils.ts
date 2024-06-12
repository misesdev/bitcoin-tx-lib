import { OP_CODES } from "../constants/opcodes"
import { Hex } from "./types"
import { ripemd160 as ripemd160Noble } from "@noble/hashes/ripemd160"
const cryptojs = require("cryptojs").Crypto
const base58 = require("bs58")

export function bytesToHex(bytes: Uint8Array): Hex {
    if (bytes.length <= 0)
        throw new Error("The byte array is empty!")

    var hexValue: string = ""

    bytes.forEach(byte => {
        let hexNumber = byte.toString(16)
        if (hexNumber.length == 1)
            hexNumber = "0" + hexNumber

        hexValue += hexNumber
    })

    return hexValue
}

export function hexToBytes(hex: string, hexadecimal: boolean = true): Uint8Array {
    if (!!!hex)
        throw new Error("hex is undefined or empty!")
    if (hexadecimal && hex.length % 2 !== 0)
        throw new Error("Invalid hex value!")

    var bytes = new Uint8Array(hexadecimal ? hex.length / 2 : hex.length)

    for (let i = 0; i <= hex.length; i += hexadecimal ? 2 : 1)
        if (hexadecimal)
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
        else
            bytes[i] = hex.charCodeAt(i)

    return bytes;
}

export function sha256(messageHash: Uint8Array, hash256: boolean = false): Hex {

    var hash = cryptojs.SHA256(messageHash)

    // if is a hash256 return sha256(sha256(content)) (doc: https://en.bitcoin.it/wiki/BIP_0174)
    if (hash256)
        return cryptojs.SHA256(hexToBytes(hash))

    return hash
}

export function ripemd160(messageHash: Uint8Array, address: boolean = false): Hex {

    var hash = address ? hexToBytes(String(sha256(messageHash))) : messageHash

    hash = ripemd160Noble(hash)

    return bytesToHex(hash)
}

export function checksum(messageHash: Uint8Array) {

    // generate the hash256(sha256(content)) and return first 4 bytes (doc: https://en.bitcoin.it/wiki/BIP_0174)
    var hash = cryptojs.SHA256(messageHash)

    return cryptojs.SHA256(hexToBytes(hash)).substring(0, 8)
}

export function reverseEndian(bytes: Uint8Array): Uint8Array {
    return bytes.reverse()
}

export function base58Encode(hex: string): string {
    return base58.encode(hexToBytes(hex))
}

export function base58Decode(value: string): Hex {
    return bytesToHex(base58.decode(value));
}

export function numberToHex(number: number = 0, bits: number = 64): Hex {

    var hexValue = number.toString(16) // string hexadecimal
    
    if(hexValue.length == 1)
        hexValue = "0" + hexValue

    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = "0" + hexValue
    }

    return hexValue
}

// Convert a integer number in Uint8Array(16) // 64 bits little-endian
export function numberToHexLE(number: number = 0, bits: number = 64): Hex {

    var hexValue = number.toString(16) // string hexadecimal

    if(hexValue.length == 1)
        hexValue = "0" + hexValue

    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = "0" + hexValue
    }

    return bytesToHex(hexToBytes(hexValue).reverse())
}

// 
export function hash160ToScript(hash160: string) : string {

    var hash160Length = (hash160.length / 2).toString(16) // 0x14 == 20

    var hexScript = OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG

    return hexScript
}