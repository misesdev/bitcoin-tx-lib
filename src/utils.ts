import { OP_CODES } from "./constants/opcodes"
import { ripemd160 as ripemd160Noble } from "@noble/hashes/ripemd160"
import { sha256 as sha256Noble } from "@noble/hashes/sha256"
import { Hex } from "./types"

type Response = "hex" | "bytes"

export function bytesToHex(bytes: Hex): string {

    if (bytes.length <= 0)
        throw new Error("The byte array is empty!")
    if(typeof(bytes) == "string")
        throw new Error("Expected the type Uint8Array")

    let hexValue: string = ""

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

    let bytes = new Uint8Array(hexadecimal ? hex.length / 2 : hex.length)

    for (let i = 0; i <= hex.length; i += hexadecimal ? 2 : 1)
        if (hexadecimal)
            bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
        else
            bytes[i] = hex.charCodeAt(i)

    return bytes;
}

export function sha256(messageHash: Hex, hash256: boolean = false): Hex {

    let data = messageHash
    
    if(typeof(messageHash) !== "object")
        data = hexToBytes(messageHash)

    let hash: Uint8Array = sha256Noble(data)

    // if is a hash256 return sha256(sha256(content)) (doc: https://en.bitcoin.it/wiki/BIP_0174)
    if (hash256)
        hash = sha256Noble(hash)

    if(typeof(messageHash) == "string")
        return bytesToHex(hash)

    return hash
}

export function ripemd160(messageHash: Hex, address: boolean = false): Hex {

    let data = messageHash

    if(typeof(messageHash) !== "object")
        data = hexToBytes(messageHash)

    let hash = address ? sha256(data) : data

    hash = ripemd160Noble(hash)
    
    if(typeof(messageHash) == "string")
        return bytesToHex(hash)

    return hash
}

export function checksum(messageHash: Hex, bytes: number = 4): Hex {
    
    let data = messageHash

    if(typeof(messageHash) !== "object")
        data = hexToBytes(messageHash)

    // generate the hash256(sha256(content)) and return first 4 bytes (doc: https://en.bitcoin.it/wiki/BIP_0174)
    let hash = sha256Noble(data)

    hash = sha256Noble(hash).slice(0, bytes) //.substring(0, bytes * 2)

    if(typeof(messageHash) == "string")
        return bytesToHex(hash)

    return hash
}

export function reverseEndian(hex: Hex): Hex {

    if(typeof(hex) == "object")
        return hex.reverse()

    let hexLE = ""
        
    for (let i = hex.length; i > 0; i -= 2) 
        hexLE += hex[i - 2] + hex[i - 1]

    return hexLE
}

export function numberToHex(number: number = 0, bits: number = 64, result: Response = "hex"): Hex {

    let hexValue = number.toString(16) // string hexadecimal

    if (hexValue.length == 1)
        hexValue = "0" + hexValue

    for (let i = hexValue.length; i < bits / 4; i++) {
        hexValue = "0" + hexValue
    }

    if(result == "hex")
        return hexValue

    return hexToBytes(hexValue)
}

// Convert a integer number in Uint8Array(16) // 64 bits little-endian
export function numberToHexLE(number: number = 0, bits: number = 64, result: Response = "hex"): Hex {

    bits = bits < 8 ? 8 : bits
    
    let hexValue = number.toString(16) // string hexadecimal

    for (let i = hexValue.length; i < bits / 4; i++)
        hexValue = "0" + hexValue

    if(result == "hex")
        return reverseEndian(hexValue)

    return hexToBytes(hexValue).reverse()
}

export function hash160ToScript(hash160: Hex): Hex {
    
    let data = hash160

    if(typeof(hash160) !== "object")
        data = hexToBytes(hash160)

    let hash160Length = data.length // 0x14 == 20 && 0x20 == 34

    // OP_DUP+OP_HASH160+PK_HASH_LENGTH+PUBKEY_HASH+OP_EQUALVERIFY+OP_CHECKSIG
    let hexScript = mergeUint8Arrays(new Uint8Array([
            OP_CODES.OP_DUP, 
            OP_CODES.OP_HASH160, 
            hash160Length
        ]),
        data as Uint8Array,
        new Uint8Array([
            OP_CODES.OP_EQUALVERIFY,
            OP_CODES.OP_CHECKSIG 
        ])
    )

    if(typeof(hash160) == "string")
        return bytesToHex(hexScript)

    return hexScript
}

export function reverseHexLE(hex: Hex, isBytes: boolean = true) : Hex {
    
    if (isBytes && hex.length <= 0)
        throw new Error("Invalid hex value!")

    if(typeof(hex) == "object")
        return hex.reverse()

    let hexLE = ''

    for (let i = hex.length; i > 0; i -= 2) 
        hexLE += hex[i - 2] + hex[i - 1]

    // return hexadecimal bytes in little-endian
    return hexLE
}

export function mergeUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
    let length = arrays.reduce((sum, e) => sum + e.length, 0)
    let mergeArray = new Uint8Array(length)

    arrays.forEach((array, index, arrays) => {
        let offset = arrays.slice(0, index).reduce((acc, e) => acc + e.length, 0)
        mergeArray.set(array, offset)
    })

    return mergeArray
}

export function isEqual(...arrays: Uint8Array[]): boolean {
    let result: boolean = true

    arrays.forEach((arr, index, arrays) => {
        if(index < arrays.length - 1) {            
            if(arr.toString() !== arrays[arrays.length - 1].toString())
                result = false
        }
    })

    return result
}

export function numberToVarTnt(value: number, resultType: Response = "hex"): Hex {

    let result: Uint8Array
    if (value < 0xfd) {
        result = new Uint8Array([value])
    } else if (value <= 0xffff) {
        var number = numberToHexLE(value, 16, "bytes") as Uint8Array
        result = mergeUint8Arrays(new Uint8Array([0xfd]), number)
    } else if (value <= 0xffffffff) {
        let number = numberToHexLE(value, 32, "bytes") as Uint8Array
        result = mergeUint8Arrays(new Uint8Array([0xfe]), number)
    } else { 
        let number = numberToHexLE(value, 64, "bytes") as Uint8Array
        result = mergeUint8Arrays(new Uint8Array([0xff]), number)
    }
    
    if(resultType == "hex")
        return bytesToHex(result)

    return result
}

export function getBytesCount(hex: string) : number 
{
    return hex.length / 2;
}
