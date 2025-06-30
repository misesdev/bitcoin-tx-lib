import { mnemonicToSeedSync } from 'bip39';
import { HDKManager } from '.';
import { ECPairKey } from '../ecpairkey';
import { HDKey } from "@scure/bip32";

const TEST_MNEMONIC = 'pistol lesson rigid season script crouch clog spin lottery canal deal leaf';
const TEST_PASSWORD = 'test-password';

describe('HDKManager', () => {

    test('should create an instance from mnemonic without password', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        expect(hdk).toBeInstanceOf(HDKManager);
    });

    test('should create an instance from mnemonic with password', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC, TEST_PASSWORD);
        expect(hdk).toBeInstanceOf(HDKManager);
    });

    test('should create an instance from master seed (hex string)', () => {
        const masterSeed = mnemonicToSeedSync(TEST_MNEMONIC);
        const hdk = HDKManager.fromMasterSeed(masterSeed);
        expect(hdk).toBeInstanceOf(HDKManager);
    });

    test('should derive private key at index 0', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const key = hdk.derivatePrivateKey(0);
        expect(key).toBeInstanceOf(Uint8Array);
        expect(key.length).toBeGreaterThan(0);
    });

    test('should derive multiple keys using listHDKeys', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const keys = hdk.deriveMultiplePrivateKeys(5);
        expect(keys.length).toBe(5);
        keys.forEach(key => {
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBeGreaterThan(0);
        });
    });

    test('should return a valid ECPairKey for index 0 (mainnet)', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const pairKey = hdk.derivatePairKey(0, { network: 'mainnet' });
        expect(pairKey).toBeInstanceOf(ECPairKey);
        expect(pairKey.getAddress('p2wpkh')).toMatch(/^bc1/);
    });

    test('should return a valid ECPairKey for index 0 (testnet)', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const pairKey = hdk.derivatePairKey(0, { network: 'testnet' });
        expect(pairKey).toBeInstanceOf(ECPairKey);
        expect(pairKey.getAddress('p2wpkh')).toMatch(/^tb1/);
    });

    test('should return multiple ECPairKeys with listPairKeys', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const keys = hdk.derivateMultiplePairKeys(3, { network: 'testnet' });
        expect(keys.length).toBe(3);
        keys.forEach(key => {
            expect(key).toBeInstanceOf(ECPairKey);
            expect(key.getAddress('p2wpkh')).toMatch(/^tb1/);
        });
    });

    test('should throw error if derived key has no private key', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        // monkey-patch internal derive to simulate error
        const original = hdk['_rootKey'].derive;
        hdk['_rootKey'].derive = () => ({ privateKey: undefined } as any);

        expect(() => hdk.derivatePrivateKey(0)).toThrow();

        hdk['_rootKey'].derive = original; // restore
    });

    test('should use default BIP44 path components when not provided', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        expect(hdk.purpose).toBe(44);
        expect(hdk.coinType).toBe(0);
        expect(hdk.account).toBe(0);
        expect(hdk.change).toBe(0);
    });

    test('should allow custom BIP44 path components via constructor', () => {
        const masterSeed = mnemonicToSeedSync(TEST_MNEMONIC);
        const hdk = new HDKManager({
            rootKey: HDKey.fromMasterSeed(masterSeed),
            purpose: 49,
            coinType: 1,
            account: 2,
            change: 1
        });

        expect(hdk.purpose).toBe(49);
        expect(hdk.coinType).toBe(1);
        expect(hdk.account).toBe(2);
        expect(hdk.change).toBe(1);
    });

    test('should generate the correct derivation path', () => {
        const hdk = HDKManager.fromMnemonic(TEST_MNEMONIC);
        const path = hdk.getDerivationPath(5);
        expect(path).toBe("m/44'/0'/0'/0/5");
    });
});
