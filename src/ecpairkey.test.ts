import { ECPairKey } from "./ecpairkey";
import { hexToBytes, sha256 } from "./utils"
import { base58 } from "@scure/base"

describe("ECPairKey", () => {
    const sampleMessage = hexToBytes("6244980fa0752e5b4643") 
    const messageHash = sha256(sampleMessage) as Uint8Array

    test("should generate a valid keypair and public key", () => {
        const key = new ECPairKey()
        const pubkey = key.getPublicKey()
        expect(pubkey).toBeInstanceOf(Uint8Array)
        expect(pubkey.length).toBe(33) // Compressed secp256k1 public key
    })

    test("should return public and private keys as hex", () => {
        const key = new ECPairKey()
        expect(typeof key.getPrivateKeyHex()).toBe("string")
        expect(typeof key.getPublicKeyHex()).toBe("string")
    })

    test("should sign and verify a message", () => {
        const key = new ECPairKey()
        const signature = key.signDER(messageHash)
        const verified = key.verifySignature(messageHash, signature)
        expect(verified).toBe(true)
    })

    test("should fail verification with altered message", () => {
        const key = new ECPairKey()
        const signature = key.signDER(messageHash)

        // Mutate the message
        const wrongMessage = new Uint8Array([...messageHash])
        wrongMessage[0] ^= 0xff

        const verified = key.verifySignature(wrongMessage, signature)
        expect(verified).toBe(false)
    })

    test("should generate a valid WIF and recover the key", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const recovered = ECPairKey.fromWif(wif)

        expect(recovered.getPrivateKeyHex()).toBe(key.getPrivateKeyHex())
        expect(recovered.getPublicKeyHex()).toBe(key.getPublicKeyHex())
    })

    test("should throw on WIF with invalid checksum", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const decoded = base58.decode(wif)

        // Invalida o checksum
        decoded[decoded.length - 1] ^= 0xff

        const brokenWif = base58.encode(decoded)

        expect(() => ECPairKey.fromWif(brokenWif)).toThrow("Wif type is invalid or not supported")
    })

    test("should throw on WIF with invalid prefix", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const decoded = base58.decode(wif)

        // Prefixo inválido (ex: 0x01)
        decoded[0] = 0x01

        const brokenWif = base58.encode(decoded)

        expect(() => ECPairKey.fromWif(brokenWif)).toThrow("Wif type is invalid or not supported")
    })

    test("should generate valid p2wpkh address", () => {
        const key = new ECPairKey()
        const address = key.getAddress("p2wpkh")
        expect(typeof address).toBe("string")
        expect(address.length).toBeGreaterThan(20)
    })

    test("should create key from hex and match", () => {
        const original = new ECPairKey()
        const hex = original.getPrivateKeyHex()
        const restored = ECPairKey.fromHex(hex)

        expect(restored.getPrivateKeyHex()).toBe(hex)
        expect(restored.getPublicKeyHex()).toBe(original.getPublicKeyHex())
    })

    test("should reject invalid hex in fromHex", () => {
        expect(() => {
            ECPairKey.fromHex("not-a-hex")
        }).toThrow()
    })

    test("should verifyWif correctly", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const decoded = base58.decode(wif)
        expect(ECPairKey.verifyWif(decoded)).toBe(true)

        decoded[0] = 0x00 // altera prefixo
        expect(ECPairKey.verifyWif(decoded)).toBe(false)
    })
})
