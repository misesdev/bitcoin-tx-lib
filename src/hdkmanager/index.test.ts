import { mnemonicToSeedSync } from "@scure/bip39"
import { HDKManager } from "."
import { ECPairKey } from "../ecpairkey"
import { HDKey } from "@scure/bip32"

const MNEMONIC = "pistol lesson rigid season script crouch clog spin lottery canal deal leaf"
const PASSPHRASE = "test-password"

// fromXPriv/fromXPub require standard BIP44 version bytes (0x0488ade4/0x0488b21e).
// @scure/bip32 only recognises those in fromExtendedKey — BIP84 versions (04b2430c/04b24746)
// are custom and cause "Version mismatch". Always use purpose:44 when testing fromXPriv/fromXPub.
const bip44Hdk = () => HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 } as any)

describe("HDKManager", () => {

    describe("factory methods", () => {
        test("fromMnemonic creates instance", () => {
            expect(HDKManager.fromMnemonic(MNEMONIC)).toBeInstanceOf(HDKManager)
        })

        test("fromMnemonic with passphrase creates instance", () => {
            expect(HDKManager.fromMnemonic(MNEMONIC, PASSPHRASE)).toBeInstanceOf(HDKManager)
        })

        test("fromMasterSeed creates instance", () => {
            const seed = mnemonicToSeedSync(MNEMONIC)
            expect(HDKManager.fromMasterSeed(seed)).toBeInstanceOf(HDKManager)
        })

        test("fromXPriv creates full-access instance (BIP44 xpriv)", () => {
            const restored = HDKManager.fromXPriv(bip44Hdk().getXPriv())
            expect(restored).toBeInstanceOf(HDKManager)
            expect(restored.hasPrivateKey()).toBe(true)
            expect(restored.getMasterPublicKey().length).toBe(33)
        })

        test("fromXPub creates watch-only instance (BIP44 xpub)", () => {
            const watchOnly = HDKManager.fromXPub(bip44Hdk().getXPub())
            expect(watchOnly).toBeInstanceOf(HDKManager)
            expect(watchOnly.hasPrivateKey()).toBe(false)
        })
    })

    describe("default path components", () => {
        test("purpose defaults to 84 (BIP84)", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC)
            expect(hdk.purpose).toBe(84)
            expect(hdk.coinType).toBe(0)
            expect(hdk.account).toBe(0)
            expect(hdk.change).toBe(0)
        })

        test("constructor accepts custom path components", () => {
            const seed = mnemonicToSeedSync(MNEMONIC)
            const hdk = new HDKManager({
                rootKey: HDKey.fromMasterSeed(seed),
                purpose: 84,
                coinType: 1,
                account: 2,
                change: 1
            })
            expect(hdk.purpose).toBe(84)
            expect(hdk.coinType).toBe(1)
            expect(hdk.account).toBe(2)
            expect(hdk.change).toBe(1)
        })
    })

    describe("purpose propagation — anti-regression", () => {
        test("purpose:84 → derivation path uses 84'", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk.purpose).toBe(84)
            expect(hdk.getDerivationPath(0)).toBe("m/84'/0'/0'/0/0")
        })

        test("purpose:44 → derivation path uses 44'", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 } as any)
            expect(hdk.purpose).toBe(44)
            expect(hdk.getDerivationPath(0)).toBe("m/44'/0'/0'/0/0")
        })

        test("purpose:44 and purpose:84 produce different keys for same mnemonic and index", () => {
            const hdk44 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 } as any)
            const hdk84 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk44.derivatePrivateKey(0)).not.toEqual(hdk84.derivatePrivateKey(0))
        })
    })

    describe("derivation path", () => {
        test("getDerivationPath produces correct BIP84 path", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC)
            expect(hdk.getDerivationPath(5)).toBe("m/84'/0'/0'/0/5")
        })

        test("pathOptions.change overrides default change value", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk.getDerivationPath(3, { change: 1 })).toBe("m/84'/0'/0'/1/3")
        })

        test("pathOptions.account overrides default account value", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk.getDerivationPath(2, { account: 1 })).toBe("m/84'/0'/1'/0/2")
        })

        test("watch-only path is relative: m/<change>/<index>", () => {
            const watchOnly = HDKManager.fromXPub(bip44Hdk().getXPub())
            expect(watchOnly.getDerivationPath(5)).toBe("m/0/5")
            expect(watchOnly.getDerivationPath(5, { change: 1 })).toBe("m/1/5")
        })
    })

    describe("private key derivation", () => {
        test("derives 32-byte private key at index 0", () => {
            const key = HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(0)
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(32)
        })

        test("derives multiple private keys", () => {
            const keys = HDKManager.fromMnemonic(MNEMONIC).deriveMultiplePrivateKeys(5)
            expect(keys.length).toBe(5)
            keys.forEach(k => {
                expect(k).toBeInstanceOf(Uint8Array)
                expect(k.length).toBe(32)
            })
        })

        test("throws on negative index", () => {
            expect(() => HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(-1)).toThrow("Invalid derivation index")
        })

        test("throws on index > 2^31-1", () => {
            expect(() => HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(2147483648)).toThrow("Invalid derivation index")
        })

        test("watch-only instance cannot derive private key", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePrivateKey(0)).toThrow("Missing private key")
        })
    })

    describe("public key derivation", () => {
        test("derives 33-byte compressed public key at index 0", () => {
            const key = HDKManager.fromMnemonic(MNEMONIC).derivatePublicKey(0)
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(33)
        })

        test("derives multiple public keys", () => {
            const keys = HDKManager.fromMnemonic(MNEMONIC).deriveMultiplePublicKeys(4)
            expect(keys.length).toBe(4)
            keys.forEach(k => expect(k.length).toBe(33))
        })

        test("watch-only instance can derive public keys", () => {
            const key = HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePublicKey(0)
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(33)
        })
    })

    describe("ECPairKey derivation", () => {
        test("derives mainnet p2wpkh address starting with bc1", () => {
            const pair = HDKManager.fromMnemonic(MNEMONIC).derivatePairKey(0, { network: "mainnet" })
            expect(pair).toBeInstanceOf(ECPairKey)
            expect(pair.getAddress("p2wpkh")).toMatch(/^bc1/)
        })

        test("derives testnet p2wpkh address starting with tb1", () => {
            const pair = HDKManager.fromMnemonic(MNEMONIC).derivatePairKey(0, { network: "testnet" })
            expect(pair.getAddress("p2wpkh")).toMatch(/^tb1/)
        })

        test("derives multiple ECPairKeys", () => {
            const pairs = HDKManager.fromMnemonic(MNEMONIC).derivateMultiplePairKeys(3, { network: "testnet" })
            expect(pairs.length).toBe(3)
            pairs.forEach(p => expect(p.getAddress("p2wpkh")).toMatch(/^tb1/))
        })

        test("pathOptions change=1 produces different key than change=0", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            const receiveKey = hdk.derivatePublicKey(0, { change: 0 })
            const changeKey = hdk.derivatePublicKey(0, { change: 1 })
            expect(receiveKey).not.toEqual(changeKey)
        })
    })

    describe("deterministic derivation", () => {
        test("same mnemonic always produces same private key at index 0", () => {
            const hdk1 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            const hdk2 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk1.derivatePrivateKey(0)).toEqual(hdk2.derivatePrivateKey(0))
        })

        test("same mnemonic always produces same public key at index 0", () => {
            const hdk1 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            const hdk2 = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk1.derivatePublicKey(0)).toEqual(hdk2.derivatePublicKey(0))
        })

        test("different indexes produce different keys", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 } as any)
            expect(hdk.derivatePrivateKey(0)).not.toEqual(hdk.derivatePrivateKey(1))
        })

        test("passphrase changes derivation output", () => {
            const withoutPass = HDKManager.fromMnemonic(MNEMONIC)
            const withPass = HDKManager.fromMnemonic(MNEMONIC, PASSPHRASE)
            expect(withoutPass.derivatePrivateKey(0)).not.toEqual(withPass.derivatePrivateKey(0))
        })
    })

    describe("fromXPriv", () => {
        test("full-access: has private key, can derive public key", () => {
            const fromXPriv = HDKManager.fromXPriv(bip44Hdk().getXPriv())
            expect(fromXPriv.hasPrivateKey()).toBe(true)
            expect(fromXPriv.getMasterPublicKey().length).toBe(33)
        })

        test("round-trip: fromXPriv produces the same public key as original manager", () => {
            const original = bip44Hdk()
            const restored = HDKManager.fromXPriv(original.getXPriv())
            expect(restored.getMasterPublicKey()).toEqual(original.getMasterPublicKey())
        })
    })

    describe("fromXPub (watch-only)", () => {
        test("watch-only: hasPrivateKey is false", () => {
            expect(HDKManager.fromXPub(bip44Hdk().getXPub()).hasPrivateKey()).toBe(false)
        })

        test("watch-only: private key derivation throws", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePrivateKey(0)).toThrow()
        })

        test("watch-only: public key derivation works", () => {
            const pubkey = HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePublicKey(0)
            expect(pubkey).toBeInstanceOf(Uint8Array)
            expect(pubkey.length).toBe(33)
        })

        test("watch-only: getXPriv throws", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).getXPriv()).toThrow("Missing private key")
        })

        test("watch-only: getMasterPrivateKey throws", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).getMasterPrivateKey()).toThrow("Missing private key")
        })

        test("xpub round-trip: same master public key as original", () => {
            const original = bip44Hdk()
            const watchOnly = HDKManager.fromXPub(original.getXPub())
            expect(watchOnly.getMasterPublicKey()).toEqual(original.getMasterPublicKey())
        })
    })

    describe("master key access", () => {
        test("hasPrivateKey returns true for full wallet", () => {
            expect(HDKManager.fromMnemonic(MNEMONIC).hasPrivateKey()).toBe(true)
        })

        test("hasPrivateKey returns false for watch-only", () => {
            expect(HDKManager.fromXPub(bip44Hdk().getXPub()).hasPrivateKey()).toBe(false)
        })

        test("getMasterPrivateKey returns 32 bytes for full wallet", () => {
            const key = HDKManager.fromMnemonic(MNEMONIC).getMasterPrivateKey()
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(32)
        })

        test("getMasterPrivateKey throws for watch-only wallet", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).getMasterPrivateKey()).toThrow("Missing private key")
        })

        test("getMasterPublicKey returns 33 bytes for both modes", () => {
            const full = bip44Hdk()
            expect(full.getMasterPublicKey().length).toBe(33)
            expect(HDKManager.fromXPub(full.getXPub()).getMasterPublicKey().length).toBe(33)
        })

        test("getXPriv returns non-empty base58 string", () => {
            const xpriv = HDKManager.fromMnemonic(MNEMONIC).getXPriv()
            expect(typeof xpriv).toBe("string")
            expect(xpriv.length).toBeGreaterThan(50)
        })

        test("getXPriv throws for watch-only", () => {
            expect(() => HDKManager.fromXPub(bip44Hdk().getXPub()).getXPriv()).toThrow("Missing private key")
        })

        test("getXPub returns non-empty base58 string", () => {
            const xpub = HDKManager.fromMnemonic(MNEMONIC).getXPub()
            expect(typeof xpub).toBe("string")
            expect(xpub.length).toBeGreaterThan(50)
        })
    })

    describe("edge: monkey-patched derive throws", () => {
        test("derivatePrivateKey throws when child has no privateKey", () => {
            const hdk = HDKManager.fromMnemonic(MNEMONIC)
            const orig = hdk["_rootKey"].derive
            hdk["_rootKey"].derive = () => ({ privateKey: undefined } as any)
            expect(() => hdk.derivatePrivateKey(0)).toThrow()
            hdk["_rootKey"].derive = orig
        })
    })
})
