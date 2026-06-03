"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_1 = require("@scure/bip39");
const _1 = require(".");
const ecpairkey_1 = require("../ecpairkey");
const bip32_1 = require("@scure/bip32");
const MNEMONIC = "pistol lesson rigid season script crouch clog spin lottery canal deal leaf";
const PASSPHRASE = "test-password";
// fromXPriv/fromXPub require standard BIP44 version bytes (0x0488ade4/0x0488b21e).
// @scure/bip32 only recognises those in fromExtendedKey — BIP84 versions (04b2430c/04b24746)
// are custom and cause "Version mismatch". Always use purpose:44 when testing fromXPriv/fromXPub.
const bip44Hdk = () => _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 });
describe("HDKManager", () => {
    describe("factory methods", () => {
        test("fromMnemonic creates instance", () => {
            expect(_1.HDKManager.fromMnemonic(MNEMONIC)).toBeInstanceOf(_1.HDKManager);
        });
        test("fromMnemonic with passphrase creates instance", () => {
            expect(_1.HDKManager.fromMnemonic(MNEMONIC, PASSPHRASE)).toBeInstanceOf(_1.HDKManager);
        });
        test("fromMasterSeed creates instance", () => {
            const seed = (0, bip39_1.mnemonicToSeedSync)(MNEMONIC);
            expect(_1.HDKManager.fromMasterSeed(seed)).toBeInstanceOf(_1.HDKManager);
        });
        test("fromXPriv creates full-access instance (BIP44 xpriv)", () => {
            const restored = _1.HDKManager.fromXPriv(bip44Hdk().getXPriv());
            expect(restored).toBeInstanceOf(_1.HDKManager);
            expect(restored.hasPrivateKey()).toBe(true);
            expect(restored.getMasterPublicKey().length).toBe(33);
        });
        test("fromXPub creates watch-only instance (BIP44 xpub)", () => {
            const watchOnly = _1.HDKManager.fromXPub(bip44Hdk().getXPub());
            expect(watchOnly).toBeInstanceOf(_1.HDKManager);
            expect(watchOnly.hasPrivateKey()).toBe(false);
        });
    });
    describe("default path components", () => {
        test("purpose defaults to 84 (BIP84)", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC);
            expect(hdk.purpose).toBe(84);
            expect(hdk.coinType).toBe(0);
            expect(hdk.account).toBe(0);
            expect(hdk.change).toBe(0);
        });
        test("constructor accepts custom path components", () => {
            const seed = (0, bip39_1.mnemonicToSeedSync)(MNEMONIC);
            const hdk = new _1.HDKManager({
                rootKey: bip32_1.HDKey.fromMasterSeed(seed),
                purpose: 84,
                coinType: 1,
                account: 2,
                change: 1
            });
            expect(hdk.purpose).toBe(84);
            expect(hdk.coinType).toBe(1);
            expect(hdk.account).toBe(2);
            expect(hdk.change).toBe(1);
        });
    });
    describe("purpose propagation — anti-regression", () => {
        test("purpose:84 → derivation path uses 84'", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk.purpose).toBe(84);
            expect(hdk.getDerivationPath(0)).toBe("m/84'/0'/0'/0/0");
        });
        test("purpose:44 → derivation path uses 44'", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 });
            expect(hdk.purpose).toBe(44);
            expect(hdk.getDerivationPath(0)).toBe("m/44'/0'/0'/0/0");
        });
        test("purpose:44 and purpose:84 produce different keys for same mnemonic and index", () => {
            const hdk44 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 44 });
            const hdk84 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk44.derivatePrivateKey(0)).not.toEqual(hdk84.derivatePrivateKey(0));
        });
    });
    describe("derivation path", () => {
        test("getDerivationPath produces correct BIP84 path", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC);
            expect(hdk.getDerivationPath(5)).toBe("m/84'/0'/0'/0/5");
        });
        test("pathOptions.change overrides default change value", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk.getDerivationPath(3, { change: 1 })).toBe("m/84'/0'/0'/1/3");
        });
        test("pathOptions.account overrides default account value", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk.getDerivationPath(2, { account: 1 })).toBe("m/84'/0'/1'/0/2");
        });
        test("watch-only path is relative: m/<change>/<index>", () => {
            const watchOnly = _1.HDKManager.fromXPub(bip44Hdk().getXPub());
            expect(watchOnly.getDerivationPath(5)).toBe("m/0/5");
            expect(watchOnly.getDerivationPath(5, { change: 1 })).toBe("m/1/5");
        });
    });
    describe("private key derivation", () => {
        test("derives 32-byte private key at index 0", () => {
            const key = _1.HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(0);
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32);
        });
        test("derives multiple private keys", () => {
            const keys = _1.HDKManager.fromMnemonic(MNEMONIC).deriveMultiplePrivateKeys(5);
            expect(keys.length).toBe(5);
            keys.forEach(k => {
                expect(k).toBeInstanceOf(Uint8Array);
                expect(k.length).toBe(32);
            });
        });
        test("throws on negative index", () => {
            expect(() => _1.HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(-1)).toThrow("Invalid derivation index");
        });
        test("throws on index > 2^31-1", () => {
            expect(() => _1.HDKManager.fromMnemonic(MNEMONIC).derivatePrivateKey(2147483648)).toThrow("Invalid derivation index");
        });
        test("watch-only instance cannot derive private key", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePrivateKey(0)).toThrow("Missing private key");
        });
    });
    describe("public key derivation", () => {
        test("derives 33-byte compressed public key at index 0", () => {
            const key = _1.HDKManager.fromMnemonic(MNEMONIC).derivatePublicKey(0);
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(33);
        });
        test("derives multiple public keys", () => {
            const keys = _1.HDKManager.fromMnemonic(MNEMONIC).deriveMultiplePublicKeys(4);
            expect(keys.length).toBe(4);
            keys.forEach(k => expect(k.length).toBe(33));
        });
        test("watch-only instance can derive public keys", () => {
            const key = _1.HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePublicKey(0);
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(33);
        });
    });
    describe("ECPairKey derivation", () => {
        test("derives mainnet p2wpkh address starting with bc1", () => {
            const pair = _1.HDKManager.fromMnemonic(MNEMONIC).derivatePairKey(0, { network: "mainnet" });
            expect(pair).toBeInstanceOf(ecpairkey_1.ECPairKey);
            expect(pair.getAddress("p2wpkh")).toMatch(/^bc1/);
        });
        test("derives testnet p2wpkh address starting with tb1", () => {
            const pair = _1.HDKManager.fromMnemonic(MNEMONIC).derivatePairKey(0, { network: "testnet" });
            expect(pair.getAddress("p2wpkh")).toMatch(/^tb1/);
        });
        test("derives multiple ECPairKeys", () => {
            const pairs = _1.HDKManager.fromMnemonic(MNEMONIC).derivateMultiplePairKeys(3, { network: "testnet" });
            expect(pairs.length).toBe(3);
            pairs.forEach(p => expect(p.getAddress("p2wpkh")).toMatch(/^tb1/));
        });
        test("pathOptions change=1 produces different key than change=0", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            const receiveKey = hdk.derivatePublicKey(0, { change: 0 });
            const changeKey = hdk.derivatePublicKey(0, { change: 1 });
            expect(receiveKey).not.toEqual(changeKey);
        });
    });
    describe("deterministic derivation", () => {
        test("same mnemonic always produces same private key at index 0", () => {
            const hdk1 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            const hdk2 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk1.derivatePrivateKey(0)).toEqual(hdk2.derivatePrivateKey(0));
        });
        test("same mnemonic always produces same public key at index 0", () => {
            const hdk1 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            const hdk2 = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk1.derivatePublicKey(0)).toEqual(hdk2.derivatePublicKey(0));
        });
        test("different indexes produce different keys", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC, undefined, { purpose: 84 });
            expect(hdk.derivatePrivateKey(0)).not.toEqual(hdk.derivatePrivateKey(1));
        });
        test("passphrase changes derivation output", () => {
            const withoutPass = _1.HDKManager.fromMnemonic(MNEMONIC);
            const withPass = _1.HDKManager.fromMnemonic(MNEMONIC, PASSPHRASE);
            expect(withoutPass.derivatePrivateKey(0)).not.toEqual(withPass.derivatePrivateKey(0));
        });
    });
    describe("fromXPriv", () => {
        test("full-access: has private key, can derive public key", () => {
            const fromXPriv = _1.HDKManager.fromXPriv(bip44Hdk().getXPriv());
            expect(fromXPriv.hasPrivateKey()).toBe(true);
            expect(fromXPriv.getMasterPublicKey().length).toBe(33);
        });
        test("round-trip: fromXPriv produces the same public key as original manager", () => {
            const original = bip44Hdk();
            const restored = _1.HDKManager.fromXPriv(original.getXPriv());
            expect(restored.getMasterPublicKey()).toEqual(original.getMasterPublicKey());
        });
    });
    describe("fromXPub (watch-only)", () => {
        test("watch-only: hasPrivateKey is false", () => {
            expect(_1.HDKManager.fromXPub(bip44Hdk().getXPub()).hasPrivateKey()).toBe(false);
        });
        test("watch-only: private key derivation throws", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePrivateKey(0)).toThrow();
        });
        test("watch-only: public key derivation works", () => {
            const pubkey = _1.HDKManager.fromXPub(bip44Hdk().getXPub()).derivatePublicKey(0);
            expect(pubkey).toBeInstanceOf(Uint8Array);
            expect(pubkey.length).toBe(33);
        });
        test("watch-only: getXPriv throws", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).getXPriv()).toThrow("Missing private key");
        });
        test("watch-only: getMasterPrivateKey throws", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).getMasterPrivateKey()).toThrow("Missing private key");
        });
        test("xpub round-trip: same master public key as original", () => {
            const original = bip44Hdk();
            const watchOnly = _1.HDKManager.fromXPub(original.getXPub());
            expect(watchOnly.getMasterPublicKey()).toEqual(original.getMasterPublicKey());
        });
    });
    describe("master key access", () => {
        test("hasPrivateKey returns true for full wallet", () => {
            expect(_1.HDKManager.fromMnemonic(MNEMONIC).hasPrivateKey()).toBe(true);
        });
        test("hasPrivateKey returns false for watch-only", () => {
            expect(_1.HDKManager.fromXPub(bip44Hdk().getXPub()).hasPrivateKey()).toBe(false);
        });
        test("getMasterPrivateKey returns 32 bytes for full wallet", () => {
            const key = _1.HDKManager.fromMnemonic(MNEMONIC).getMasterPrivateKey();
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32);
        });
        test("getMasterPrivateKey throws for watch-only wallet", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).getMasterPrivateKey()).toThrow("Missing private key");
        });
        test("getMasterPublicKey returns 33 bytes for both modes", () => {
            const full = bip44Hdk();
            expect(full.getMasterPublicKey().length).toBe(33);
            expect(_1.HDKManager.fromXPub(full.getXPub()).getMasterPublicKey().length).toBe(33);
        });
        test("getXPriv returns non-empty base58 string", () => {
            const xpriv = _1.HDKManager.fromMnemonic(MNEMONIC).getXPriv();
            expect(typeof xpriv).toBe("string");
            expect(xpriv.length).toBeGreaterThan(50);
        });
        test("getXPriv throws for watch-only", () => {
            expect(() => _1.HDKManager.fromXPub(bip44Hdk().getXPub()).getXPriv()).toThrow("Missing private key");
        });
        test("getXPub returns non-empty base58 string", () => {
            const xpub = _1.HDKManager.fromMnemonic(MNEMONIC).getXPub();
            expect(typeof xpub).toBe("string");
            expect(xpub.length).toBeGreaterThan(50);
        });
    });
    describe("edge: monkey-patched derive throws", () => {
        test("derivatePrivateKey throws when child has no privateKey", () => {
            const hdk = _1.HDKManager.fromMnemonic(MNEMONIC);
            const orig = hdk["_rootKey"].derive;
            hdk["_rootKey"].derive = () => ({ privateKey: undefined });
            expect(() => hdk.derivatePrivateKey(0)).toThrow();
            hdk["_rootKey"].derive = orig;
        });
    });
});
//# sourceMappingURL=index.test.js.map