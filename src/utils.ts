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
        if(hexadecimal)
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16)
        else 
            bytes[i] = hex.charCodeAt(i)

    return bytes;
}

export function sha256(messageHash: Uint8Array, checksum: boolean = false, hash256: boolean = false): Hex {

    var hash = cryptojs.SHA256(messageHash)

    if (checksum)
        return cryptojs.SHA256(hexToBytes(hash)).substring(0, 8)

    if(hash256)
        return cryptojs.SHA256(hexToBytes(hash))

    return hash
}

export function ripemd160(messageHash: Uint8Array, address: boolean = false): Hex {

    var hash = address ? hexToBytes(sha256(messageHash).toString()) : messageHash

    hash = ripemd160Noble(hash)

    return bytesToHex(hash)
}

export function reverseEndian(bytes: Uint8Array) : Uint8Array {
    return  bytes.reverse()
}

export function base58Encode(hex: string) : string {
    return base58.encode(hexToBytes(hex))
}

export function base58Decode(value: string): Hex {
    return bytesToHex(base58.decode(value));
}

