import { OP_CODES } from "./constants/opcodes"
import { ripemd160 as ripemd160Noble } from "@noble/hashes/ripemd160"
import { sha256 as sha256Noble } from "@noble/hashes/sha256"

export function bytesToHex(bytes: Uint8Array): string {
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
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
        else
            bytes[i] = hex.charCodeAt(i)

    return bytes;
}

export function sha256(messageHash: Uint8Array, hash256: boolean = false): string {

    var hash: Uint8Array = sha256Noble(messageHash)

    // if is a hash256 return sha256(sha256(content)) (doc: https://en.bitcoin.it/wiki/BIP_0174)
    if (hash256)
        return bytesToHex(sha256Noble(hash))

    return bytesToHex(hash)
}

export function ripemd160(messageHash: Uint8Array, address: boolean = false): string {

    var hash = address ? hexToBytes(String(sha256(messageHash))) : messageHash

    hash = ripemd160Noble(hash)

    return bytesToHex(hash)
}

export function checksum(messageHash: Uint8Array) {

    // generate the hash256(sha256(content)) and return first 4 bytes (doc: https://en.bitcoin.it/wiki/BIP_0174)
    var hash = sha256Noble(messageHash)

    return bytesToHex(sha256Noble(hash)).substring(0, 8)
}

export function reverseEndian(bytes: Uint8Array): Uint8Array {
    return bytes.reverse()
}

export function numberToHex(number: number = 0, bits: number = 64): string {

    var hexValue = number.toString(16) // string hexadecimal

    if (hexValue.length == 1)
        hexValue = "0" + hexValue

    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = "0" + hexValue
    }

    return hexValue
}

// Convert a integer number in Uint8Array(16) // 64 bits little-endian
export function numberToHexLE(number: number = 0, bits: number = 64): string {

    var hexValue = number.toString(16) // string hexadecimal

    if (hexValue.length == 1)
        hexValue = "0" + hexValue

    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = hexValue + "0"
    }

    return hexValue
}

export function hash160ToScript(hash160: string): string {

    var hash160Length = numberToHex(hash160.length / 2, 8) // 0x14 == 20

    var hexScript = OP_CODES.OP_DUP + OP_CODES.OP_HASH160 + hash160Length + hash160 + OP_CODES.OP_EQUALVERIFY + OP_CODES.OP_CHECKSIG

    return hexScript
}

export function reverseHexLE(hex: string, isBytes: boolean = true) {

    if (!!!hex)
        throw new Error("hex is undefined or empty!")
    if (isBytes && hex.length % 2 !== 0)
        throw new Error("Invalid hex value!")

    let hexLE = '';

    for (let i = hex.length; i > 0; i -= 2) {
        hexLE += hex[i - 2] + hex[i - 1];
    }

    // return hexadecimal bytes in little-endian
    return hexLE;
}