"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// MnemonicUtils.test.ts
const mnemonic_1 = require("./mnemonic");
const english_1 = require("@scure/bip39/wordlists/english");
describe('MnemonicUtils', () => {
    describe('generateMnemonic', () => {
        test('should generate a 12-word mnemonic by default (128 bits)', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic();
            const words = mnemonic.split(' ');
            expect(words.length).toBe(12);
            words.forEach(word => {
                expect(english_1.wordlist).toContain(word);
            });
        });
        test('should generate a 24-word mnemonic when strength is 256 bits', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic(256);
            const words = mnemonic.split(' ');
            expect(words.length).toBe(24);
            words.forEach(word => {
                expect(english_1.wordlist).toContain(word);
            });
        });
        test('should throw an error for invalid strength value (e.g., 123)', () => {
            expect(() => mnemonic_1.MnemonicUtils.generateMnemonic(123)).toThrow();
        });
    });
    describe('getWords', () => {
        test('should return the full wordlist if no search term is provided', () => {
            const result = mnemonic_1.MnemonicUtils.getWords();
            expect(result).toEqual(english_1.wordlist);
            expect(result.length).toBe(2048);
        });
        test('should return words that include the provided search term', () => {
            const result = mnemonic_1.MnemonicUtils.getWords('ab');
            expect(result.length).toBeGreaterThan(0);
            expect(result.every(word => word.includes('ab'))).toBe(true);
        });
        test('should trim and lowercase the search term before filtering', () => {
            const result1 = mnemonic_1.MnemonicUtils.getWords(' aB  ');
            const result2 = mnemonic_1.MnemonicUtils.getWords('AB');
            expect(result1).toEqual(result2);
        });
        test('should return an empty array if no matches are found', () => {
            const result = mnemonic_1.MnemonicUtils.getWords('nonexistentword');
            expect(result).toEqual([]);
        });
    });
    describe('validateMnemonic', () => {
        test('should return true for valid mnemonic', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic();
            expect(mnemonic_1.MnemonicUtils.validateMnemonic(mnemonic)).toBe(true);
        });
        test('should return false for invalid mnemonic', () => {
            const mnemonic = 'foo bar baz';
            expect(mnemonic_1.MnemonicUtils.validateMnemonic(mnemonic)).toBe(false);
        });
    });
    describe('mnemonicToEntropy', () => {
        test('should convert mnemonic to entropy', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic();
            const entropy = mnemonic_1.MnemonicUtils.mnemonicToEntropy(mnemonic);
            expect(entropy.length).toBe(16);
        });
        test('should throw for invalid mnemonic', () => {
            expect(() => mnemonic_1.MnemonicUtils.mnemonicToEntropy('invalid mnemonic')).toThrow('Invalid mnemonic.');
        });
    });
    describe('entropyToMnemonic', () => {
        test('should convert valid entropy to mnemonic', () => {
            const entropy = new Uint8Array([123, 87, 45, 200, 14, 99, 2, 240, 176, 33, 78, 91, 143, 19, 201, 64]);
            const mnemonic = mnemonic_1.MnemonicUtils.entropyToMnemonic(entropy);
            expect(mnemonic_1.MnemonicUtils.validateMnemonic(mnemonic)).toBe(true);
        });
        test('should throw for invalid entropy hex', () => {
            expect(() => mnemonic_1.MnemonicUtils.entropyToMnemonic(new Uint8Array([1, 2, 3])))
                .toThrow("Invalid size entropy");
            expect(() => mnemonic_1.MnemonicUtils.entropyToMnemonic(new Uint8Array([23, 45, 34, 213, 45, 57, 3])))
                .toThrow("Invalid size entropy");
            const lowEntropy = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
            expect(() => mnemonic_1.MnemonicUtils.entropyToMnemonic(lowEntropy))
                .toThrow("Low entropy, unsafe entropy level");
        });
    });
    describe('mnemonicToSeed', () => {
        test('should convert mnemonic to seed', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic();
            const seed = mnemonic_1.MnemonicUtils.mnemonicToSeed(mnemonic);
            expect(seed instanceof Uint8Array).toBe(true);
        });
        test('should throw if mnemonic is invalid', () => {
            expect(() => mnemonic_1.MnemonicUtils.mnemonicToSeed('invalid mnemonic'))
                .toThrow('Invalid mnemonic');
        });
        test('should throw if passphrase is not a string', () => {
            const mnemonic = mnemonic_1.MnemonicUtils.generateMnemonic();
            expect(() => mnemonic_1.MnemonicUtils.mnemonicToSeed(mnemonic, 123))
                .toThrow('Passphrase must be a string');
        });
    });
    describe('getRandomWord', () => {
        test('should return a word from the wordlist', () => {
            const word = mnemonic_1.MnemonicUtils.getRandomWord();
            expect(english_1.wordlist).toContain(word);
        });
    });
});
//# sourceMappingURL=mnemonic.test.js.map