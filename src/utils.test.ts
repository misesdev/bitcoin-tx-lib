import { bytesToHex, checksum, hash160ToScript, hexToBytes, numberToHex, numberToHexLE, reverseEndian, reverseHexLE, ripemd160, sha256 } from "./utils"

describe("utils", () => {
    it("bytes to hex string", () => {
        var bytes = new Uint8Array(4)
        let array = [5, 128, 255, 255]
        array.forEach((byte, index) => bytes[index] = byte)

        var hex = bytesToHex(bytes)

        expect(hex).toBe("0580ffff")

        let error = false
        try { bytesToHex(new Uint8Array()) } catch { error = true }
        // a validation error should occur as the value is empty
        expect(error).toBe(true)
    })
    it("hex to byte array", () => {
        var hex = "0580ffff"

        var bytes = hexToBytes(hex)

        expect(bytes[0]).toBe(5)
        expect(bytes[1]).toBe(128)
        expect(bytes[2]).toBe(255)
        expect(bytes[3]).toBe(255)

        let error = false
        try { hexToBytes("") } catch { error = true }
        // a validation error should occur as the value is empty
        expect(error).toBe(true)

        error = false
        try { hexToBytes("80ff05f") } catch { error = true }
        // deve ocorrer um erro de validação, pois o valor está incorreto
        expect(error).toBe(true)
    })
    it("hash sha256 and hash256", () => {
        const hash = sha256(hexToBytes("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"))

        expect(hash).toBeDefined()

        const hash256 = sha256(hexToBytes("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"), true)
        expect(hash256).toBe("507a5b8dfed0fc6fe8801743720cedec06aa5c6fca72b07c49964492fb98a714")
    })
    it("hash checksum", () => {
        const checksumBytes = checksum(hexToBytes("800C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D"))
        expect(String(checksumBytes).toUpperCase()).toBe("507A5B8D")
    })
    it("hash ripemd160", () => {

        let sha256 = "6b23c0eabc34e97f4b5f8c2277d6b7f6869b16dfb4f2c284b94efc13a3d81b0c" 
        let expectRipemd160 = "825e1e77af4ea56228f2c96385dc24d9ba788a8c" 

        var hash = ripemd160(hexToBytes(sha256))

        expect(hash).toBe(expectRipemd160)

        // generating ripemd160 hash based on characters and not considering hexadecimal
        var hash = ripemd160(hexToBytes(sha256, false))
        expect(hash).toBe("fad534e4b13dd564f2c0e20120e79ff1d5b07548")

        // generate for address ripemd160(sha256(hash))
        hash = ripemd160(hexToBytes(sha256), true)
        expect(hash).toBe("58077dda57de14ac9f055c64bf3c71ff0b5796da")
    })
    it("reverse endian bytes", () => {
        const bytes = new Uint8Array(4)

        bytes[0] = 0x80
        bytes[1] = 0x45
        bytes[2] = 0xf8
        bytes[3] = 0xff

        const letleEndian = reverseEndian(bytes)

        expect(letleEndian[0]).toBe(0xff)
        expect(letleEndian[1]).toBe(0xf8)
        expect(letleEndian[2]).toBe(0x45)
        expect(letleEndian[3]).toBe(0x80)
    })
    it("convert a number integer in hexadecimal", () => {
        var hexNumber = numberToHex(1, 32) // 32bits
        expect(hexNumber).toBe("00000001")

        hexNumber = numberToHex(0, 32)
        expect(hexNumber).toBe("00000000")
    })
    it("convert a number integer in hexadecimal(little-endian)", () => {
        var hexNumber = numberToHexLE(1, 32) // 32bits
        expect(hexNumber).toBe("01000000")

        hexNumber = numberToHexLE(0, 32)
        expect(hexNumber).toBe("00000000")
    })
    it("generate script from hash160", () => {

        var script = hash160ToScript("18ba14b3682295cb05230e31fecb000892406608")

        expect(script).toBe("76a91418ba14b3682295cb05230e31fecb00089240660888ac")

        script = hash160ToScript("6bf19e55f94d986b4640c154d864699341919511")

        expect(script).toBe("76a9146bf19e55f94d986b4640c154d86469934191951188ac")
    })
    it("convert hexadecimal string bytes in little-endian", () => {
        var little = reverseHexLE("ff8099")

        expect(little).toBe("9980ff")
    })
}) 
