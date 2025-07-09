"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bip39_1 = require("bip39");
const _1 = require(".");
const ecpairkey_1 = require("../ecpairkey");
const bip32_1 = require("@scure/bip32");
const TEST_MNEMONIC = 'pistol lesson rigid season script crouch clog spin lottery canal deal leaf';
const TEST_PASSWORD = 'test-password';
describe('HDKManager', () => {
    test('should create an instance from mnemonic without password', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        expect(hdk).toBeInstanceOf(_1.HDKManager);
    });
    test('should create an instance from mnemonic with password', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC, TEST_PASSWORD);
        expect(hdk).toBeInstanceOf(_1.HDKManager);
    });
    test('should create an instance from master seed (hex string)', () => {
        const masterSeed = (0, bip39_1.mnemonicToSeedSync)(TEST_MNEMONIC);
        const hdk = _1.HDKManager.fromMasterSeed(masterSeed);
        expect(hdk).toBeInstanceOf(_1.HDKManager);
    });
    test('should derive private key at index 0', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const key = hdk.derivatePrivateKey(0);
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBeGreaterThan(0);
    });
    test('should derive multiple keys using listHDKeys', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const keys = hdk.deriveMultiplePrivateKeys(5);
        expect(keys.length).toBe(5);
        keys.forEach(key => {
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBeGreaterThan(0);
        });
    });
    test('should return a valid ECPairKey for index 0 (mainnet)', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const pairKey = hdk.derivatePairKey(0, { network: 'mainnet' });
        expect(pairKey).toBeInstanceOf(ecpairkey_1.ECPairKey);
        expect(pairKey.getAddress('p2wpkh')).toMatch(/^bc1/);
    });
    test('should return a valid ECPairKey for index 0 (testnet)', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const pairKey = hdk.derivatePairKey(0, { network: 'testnet' });
        expect(pairKey).toBeInstanceOf(ecpairkey_1.ECPairKey);
        expect(pairKey.getAddress('p2wpkh')).toMatch(/^tb1/);
    });
    test('should return multiple ECPairKeys with listPairKeys', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const keys = hdk.derivateMultiplePairKeys(3, { network: 'testnet' });
        expect(keys.length).toBe(3);
        keys.forEach(key => {
            expect(key).toBeInstanceOf(ecpairkey_1.ECPairKey);
            expect(key.getAddress('p2wpkh')).toMatch(/^tb1/);
        });
    });
    test('should throw error if derived key has no private key', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        // monkey-patch internal derive to simulate error
        const original = hdk['_rootKey'].derive;
        hdk['_rootKey'].derive = () => ({ privateKey: undefined });
        expect(() => hdk.derivatePrivateKey(0)).toThrow();
        hdk['_rootKey'].derive = original; // restore
    });
    test('should use default BIP44 path components when not provided', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        expect(hdk.purpose).toBe(84);
        expect(hdk.coinType).toBe(0);
        expect(hdk.account).toBe(0);
        expect(hdk.change).toBe(0);
    });
    test('should allow custom BIP44 path components via constructor', () => {
        const masterSeed = (0, bip39_1.mnemonicToSeedSync)(TEST_MNEMONIC);
        const hdk = new _1.HDKManager({
            rootKey: bip32_1.HDKey.fromMasterSeed(masterSeed),
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
    test('should generate the correct derivation path', () => {
        const hdk = _1.HDKManager.fromMnemonic(TEST_MNEMONIC);
        const path = hdk.getDerivationPath(5);
        expect(path).toBe("m/84'/0'/0'/0/5");
    });
});
//# sourceMappingURL=index.test.js.map