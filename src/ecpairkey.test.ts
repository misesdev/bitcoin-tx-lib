import { ECPairKey } from "./ecpairkey"
import { hexToBytes, sha256, hash256 } from "./utils"
import { base58 } from "@scure/base"
import { secp256k1 } from "@noble/curves/secp256k1.js"

describe("ECPairKey", () => {
    const sampleMessage = hexToBytes("6244980fa0752e5b4643")
    const messageHash = sha256(sampleMessage) as Uint8Array

    test("should generate a valid keypair and public key", () => {
        const key = new ECPairKey()
        const pubkey = key.getPublicKey()
        expect(pubkey).toBeInstanceOf(Uint8Array)
        expect(pubkey.length).toBe(33)
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
        const wrongMessage = new Uint8Array([...messageHash])
        wrongMessage[0] ^= 0xff
        expect(key.verifySignature(wrongMessage, signature)).toBe(false)
    })

    test("should fail verification with a different key", () => {
        const key1 = new ECPairKey()
        const key2 = new ECPairKey()
        const signature = key1.signDER(messageHash)
        expect(key2.verifySignature(messageHash, signature)).toBe(false)
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
        decoded[decoded.length - 1] ^= 0xff
        const brokenWif = base58.encode(decoded)
        expect(() => ECPairKey.fromWif(brokenWif)).toThrow("Wif type is invalid or not supported")
    })

    test("should throw on WIF with invalid prefix", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const decoded = base58.decode(wif)
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
        expect(() => ECPairKey.fromHex("not-a-hex")).toThrow()
    })

    test("should verifyWif correctly", () => {
        const key = new ECPairKey()
        const wif = key.getWif()
        const decoded = base58.decode(wif)
        expect(ECPairKey.verifyWif(decoded)).toBe(true)
        decoded[0] = 0x00
        expect(ECPairKey.verifyWif(decoded)).toBe(false)
    })

    describe("network-specific WIF prefixes", () => {
        test("mainnet WIF starts with K or L (compressed)", () => {
            const key = new ECPairKey({ network: "mainnet" })
            const wif = key.getWif()
            expect(wif[0]).toMatch(/^[KL]/)
        })

        test("testnet WIF starts with c (compressed)", () => {
            const key = new ECPairKey({ network: "testnet" })
            const wif = key.getWif()
            expect(wif[0]).toBe("c")
        })

        test("WIF round-trip preserves mainnet network", () => {
            const key = new ECPairKey({ network: "mainnet" })
            const restored = ECPairKey.fromWif(key.getWif())
            expect(restored.network).toBe("mainnet")
            expect(restored.getPrivateKeyHex()).toBe(key.getPrivateKeyHex())
        })

        test("WIF round-trip preserves testnet network", () => {
            const key = new ECPairKey({ network: "testnet" })
            const restored = ECPairKey.fromWif(key.getWif())
            expect(restored.network).toBe("testnet")
            expect(restored.getPrivateKeyHex()).toBe(key.getPrivateKeyHex())
        })

        test("mainnet and testnet WIF are different for the same private key", () => {
            const privKey = new ECPairKey().getPrivateKey()
            const mainnet = ECPairKey.fromHex(Buffer.from(privKey).toString("hex"), "mainnet")
            const testnet = ECPairKey.fromHex(Buffer.from(privKey).toString("hex"), "testnet")
            expect(mainnet.getWif()).not.toBe(testnet.getWif())
        })
    })

    describe("address types and network prefixes", () => {
        test("mainnet p2wpkh address starts with bc1", () => {
            const key = new ECPairKey({ network: "mainnet" })
            expect(key.getAddress("p2wpkh")).toMatch(/^bc1/)
        })

        test("testnet p2wpkh address starts with tb1", () => {
            const key = new ECPairKey({ network: "testnet" })
            expect(key.getAddress("p2wpkh")).toMatch(/^tb1/)
        })

        test("mainnet p2pkh address starts with 1", () => {
            const key = new ECPairKey({ network: "mainnet" })
            expect(key.getAddress("p2pkh")).toMatch(/^1/)
        })

        test("testnet p2pkh address starts with m or n", () => {
            const key = new ECPairKey({ network: "testnet" })
            expect(key.getAddress("p2pkh")).toMatch(/^[mn]/)
        })

        test("p2wpkh and p2pkh produce different addresses for the same key", () => {
            const key = new ECPairKey({ network: "mainnet" })
            expect(key.getAddress("p2wpkh")).not.toBe(key.getAddress("p2pkh"))
        })
    })

    describe("DER signature length and validity", () => {
        test("DER signature is between 69 and 72 bytes", () => {
            for (let i = 0; i < 20; i++) {
                const key = new ECPairKey()
                const sig = key.signDER(messageHash)
                expect(sig.length).toBeGreaterThanOrEqual(69)
                expect(sig.length).toBeLessThanOrEqual(72)
            }
        })

        test("DER signature starts with 0x30 (SEQUENCE marker)", () => {
            const key = new ECPairKey()
            const sig = key.signDER(messageHash)
            expect(sig[0]).toBe(0x30)
        })

        test("signature is valid immediately after signing", () => {
            for (let i = 0; i < 5; i++) {
                const key = new ECPairKey()
                const sig = key.signDER(messageHash)
                expect(key.verifySignature(messageHash, sig)).toBe(true)
            }
        })
    })

    // ── PREHASH REGRESSION — anti-regression for @noble/curves v2 ────────────
    // @noble/curves v2 changed the default to prehash:true (applies SHA256 to the
    // message before signing). Bitcoin sighashes are already hash256(preimage), so
    // prehash:false MUST be set. Without it, the library signs sha256(sighash) instead
    // of sighash, producing a signature that passes our internal verify() but is
    // rejected by every Bitcoin node.
    describe("prehash:false — signDER produces Bitcoin-valid signatures", () => {
        // A realistic Bitcoin sighash (32 bytes, already double-SHA256)
        const sighash = hexToBytes("c57776e82bb26ba28f5c6b3292f7c40af5dbcf11f2d2ba2ba8709cb93a85b392")

        test("signDER over sighash passes raw prehash:false verify (what Bitcoin nodes do)", () => {
            const key = new ECPairKey()
            const sig = key.signDER(sighash)
            const pubkey = key.getPublicKey()
            // Verify without extra hashing — this is exactly what Bitcoin Script does
            const isValid = secp256k1.verify(sig, sighash, pubkey, { format: 'der', prehash: false })
            expect(isValid).toBe(true)
        })

        test("signDER over sighash does NOT pass prehash:true verify (would mean double-hashed)", () => {
            const key = new ECPairKey()
            const sig = key.signDER(sighash)
            const pubkey = key.getPublicKey()
            // If this were true, we'd be signing sha256(sighash) — wrong for Bitcoin
            const wouldBeDouble = secp256k1.verify(sig, sighash, pubkey, { format: 'der', prehash: true })
            expect(wouldBeDouble).toBe(false)
        })

        test("verifySignature is consistent with signDER on a Bitcoin sighash", () => {
            const key = new ECPairKey()
            const sig = key.signDER(sighash)
            expect(key.verifySignature(sighash, sig)).toBe(true)
        })

        test("DER sig over hash256 is a different signature than over sha256(hash256)", () => {
            const key = ECPairKey.fromHex("1111111111111111111111111111111111111111111111111111111111111111")
            const sigCorrect = key.signDER(sighash)   // prehash:false — signs sighash directly
            // What a prehash:true call would produce:
            const sigWrong = secp256k1.sign(sighash, key.getPrivateKey(), { lowS: true, format: 'der', prehash: true })
            // Deterministic key → same r/s only if same message; different prehash → different
            const pubkey = key.getPublicKey()
            expect(secp256k1.verify(sigCorrect, sighash, pubkey, { format: 'der', prehash: false })).toBe(true)
            expect(secp256k1.verify(sigWrong,   sighash, pubkey, { format: 'der', prehash: false })).toBe(false)
        })
    })

    describe("fromHex network parameter", () => {
        test("fromHex defaults to mainnet", () => {
            const key = new ECPairKey()
            const restored = ECPairKey.fromHex(key.getPrivateKeyHex())
            expect(restored.network).toBe("mainnet")
        })

        test("fromHex respects explicit testnet parameter", () => {
            const key = new ECPairKey()
            const restored = ECPairKey.fromHex(key.getPrivateKeyHex(), "testnet")
            expect(restored.network).toBe("testnet")
            expect(restored.getAddress("p2wpkh")).toMatch(/^tb1/)
        })

        test("fromHex and constructor produce same public key for same private key", () => {
            const key = new ECPairKey()
            const fromHex = ECPairKey.fromHex(key.getPrivateKeyHex())
            expect(fromHex.getPublicKeyHex()).toBe(key.getPublicKeyHex())
        })
    })
})
