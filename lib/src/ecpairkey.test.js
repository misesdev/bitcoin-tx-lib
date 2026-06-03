"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("./ecpairkey");
const utils_1 = require("./utils");
const base_1 = require("@scure/base");
describe("ECPairKey", () => {
    const sampleMessage = (0, utils_1.hexToBytes)("6244980fa0752e5b4643");
    const messageHash = (0, utils_1.sha256)(sampleMessage);
    test("should generate a valid keypair and public key", () => {
        const key = new ecpairkey_1.ECPairKey();
        const pubkey = key.getPublicKey();
        expect(pubkey).toBeInstanceOf(Uint8Array);
        expect(pubkey.length).toBe(33);
    });
    test("should return public and private keys as hex", () => {
        const key = new ecpairkey_1.ECPairKey();
        expect(typeof key.getPrivateKeyHex()).toBe("string");
        expect(typeof key.getPublicKeyHex()).toBe("string");
    });
    test("should sign and verify a message", () => {
        const key = new ecpairkey_1.ECPairKey();
        const signature = key.signDER(messageHash);
        const verified = key.verifySignature(messageHash, signature);
        expect(verified).toBe(true);
    });
    test("should fail verification with altered message", () => {
        const key = new ecpairkey_1.ECPairKey();
        const signature = key.signDER(messageHash);
        const wrongMessage = new Uint8Array([...messageHash]);
        wrongMessage[0] ^= 0xff;
        expect(key.verifySignature(wrongMessage, signature)).toBe(false);
    });
    test("should fail verification with a different key", () => {
        const key1 = new ecpairkey_1.ECPairKey();
        const key2 = new ecpairkey_1.ECPairKey();
        const signature = key1.signDER(messageHash);
        expect(key2.verifySignature(messageHash, signature)).toBe(false);
    });
    test("should generate a valid WIF and recover the key", () => {
        const key = new ecpairkey_1.ECPairKey();
        const wif = key.getWif();
        const recovered = ecpairkey_1.ECPairKey.fromWif(wif);
        expect(recovered.getPrivateKeyHex()).toBe(key.getPrivateKeyHex());
        expect(recovered.getPublicKeyHex()).toBe(key.getPublicKeyHex());
    });
    test("should throw on WIF with invalid checksum", () => {
        const key = new ecpairkey_1.ECPairKey();
        const wif = key.getWif();
        const decoded = base_1.base58.decode(wif);
        decoded[decoded.length - 1] ^= 0xff;
        const brokenWif = base_1.base58.encode(decoded);
        expect(() => ecpairkey_1.ECPairKey.fromWif(brokenWif)).toThrow("Wif type is invalid or not supported");
    });
    test("should throw on WIF with invalid prefix", () => {
        const key = new ecpairkey_1.ECPairKey();
        const wif = key.getWif();
        const decoded = base_1.base58.decode(wif);
        decoded[0] = 0x01;
        const brokenWif = base_1.base58.encode(decoded);
        expect(() => ecpairkey_1.ECPairKey.fromWif(brokenWif)).toThrow("Wif type is invalid or not supported");
    });
    test("should generate valid p2wpkh address", () => {
        const key = new ecpairkey_1.ECPairKey();
        const address = key.getAddress("p2wpkh");
        expect(typeof address).toBe("string");
        expect(address.length).toBeGreaterThan(20);
    });
    test("should create key from hex and match", () => {
        const original = new ecpairkey_1.ECPairKey();
        const hex = original.getPrivateKeyHex();
        const restored = ecpairkey_1.ECPairKey.fromHex(hex);
        expect(restored.getPrivateKeyHex()).toBe(hex);
        expect(restored.getPublicKeyHex()).toBe(original.getPublicKeyHex());
    });
    test("should reject invalid hex in fromHex", () => {
        expect(() => ecpairkey_1.ECPairKey.fromHex("not-a-hex")).toThrow();
    });
    test("should verifyWif correctly", () => {
        const key = new ecpairkey_1.ECPairKey();
        const wif = key.getWif();
        const decoded = base_1.base58.decode(wif);
        expect(ecpairkey_1.ECPairKey.verifyWif(decoded)).toBe(true);
        decoded[0] = 0x00;
        expect(ecpairkey_1.ECPairKey.verifyWif(decoded)).toBe(false);
    });
    describe("network-specific WIF prefixes", () => {
        test("mainnet WIF starts with K or L (compressed)", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "mainnet" });
            const wif = key.getWif();
            expect(wif[0]).toMatch(/^[KL]/);
        });
        test("testnet WIF starts with c (compressed)", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "testnet" });
            const wif = key.getWif();
            expect(wif[0]).toBe("c");
        });
        test("WIF round-trip preserves mainnet network", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "mainnet" });
            const restored = ecpairkey_1.ECPairKey.fromWif(key.getWif());
            expect(restored.network).toBe("mainnet");
            expect(restored.getPrivateKeyHex()).toBe(key.getPrivateKeyHex());
        });
        test("WIF round-trip preserves testnet network", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "testnet" });
            const restored = ecpairkey_1.ECPairKey.fromWif(key.getWif());
            expect(restored.network).toBe("testnet");
            expect(restored.getPrivateKeyHex()).toBe(key.getPrivateKeyHex());
        });
        test("mainnet and testnet WIF are different for the same private key", () => {
            const privKey = new ecpairkey_1.ECPairKey().getPrivateKey();
            const mainnet = ecpairkey_1.ECPairKey.fromHex(Buffer.from(privKey).toString("hex"), "mainnet");
            const testnet = ecpairkey_1.ECPairKey.fromHex(Buffer.from(privKey).toString("hex"), "testnet");
            expect(mainnet.getWif()).not.toBe(testnet.getWif());
        });
    });
    describe("address types and network prefixes", () => {
        test("mainnet p2wpkh address starts with bc1", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "mainnet" });
            expect(key.getAddress("p2wpkh")).toMatch(/^bc1/);
        });
        test("testnet p2wpkh address starts with tb1", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "testnet" });
            expect(key.getAddress("p2wpkh")).toMatch(/^tb1/);
        });
        test("mainnet p2pkh address starts with 1", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "mainnet" });
            expect(key.getAddress("p2pkh")).toMatch(/^1/);
        });
        test("testnet p2pkh address starts with m or n", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "testnet" });
            expect(key.getAddress("p2pkh")).toMatch(/^[mn]/);
        });
        test("p2wpkh and p2pkh produce different addresses for the same key", () => {
            const key = new ecpairkey_1.ECPairKey({ network: "mainnet" });
            expect(key.getAddress("p2wpkh")).not.toBe(key.getAddress("p2pkh"));
        });
    });
    describe("DER signature length and validity", () => {
        test("DER signature is between 70 and 72 bytes", () => {
            for (let i = 0; i < 20; i++) {
                const key = new ecpairkey_1.ECPairKey();
                const sig = key.signDER(messageHash);
                expect(sig.length).toBeGreaterThanOrEqual(70);
                expect(sig.length).toBeLessThanOrEqual(72);
            }
        });
        test("DER signature starts with 0x30 (SEQUENCE marker)", () => {
            const key = new ecpairkey_1.ECPairKey();
            const sig = key.signDER(messageHash);
            expect(sig[0]).toBe(0x30);
        });
        test("signature is valid immediately after signing", () => {
            for (let i = 0; i < 5; i++) {
                const key = new ecpairkey_1.ECPairKey();
                const sig = key.signDER(messageHash);
                expect(key.verifySignature(messageHash, sig)).toBe(true);
            }
        });
    });
    describe("fromHex network parameter", () => {
        test("fromHex defaults to mainnet", () => {
            const key = new ecpairkey_1.ECPairKey();
            const restored = ecpairkey_1.ECPairKey.fromHex(key.getPrivateKeyHex());
            expect(restored.network).toBe("mainnet");
        });
        test("fromHex respects explicit testnet parameter", () => {
            const key = new ecpairkey_1.ECPairKey();
            const restored = ecpairkey_1.ECPairKey.fromHex(key.getPrivateKeyHex(), "testnet");
            expect(restored.network).toBe("testnet");
            expect(restored.getAddress("p2wpkh")).toMatch(/^tb1/);
        });
        test("fromHex and constructor produce same public key for same private key", () => {
            const key = new ecpairkey_1.ECPairKey();
            const fromHex = ecpairkey_1.ECPairKey.fromHex(key.getPrivateKeyHex());
            expect(fromHex.getPublicKeyHex()).toBe(key.getPublicKeyHex());
        });
    });
});
//# sourceMappingURL=ecpairkey.test.js.map