"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MnemonicUtils = void 0;
const bip39_1 = require("@scure/bip39");
const english_1 = require("@scure/bip39/wordlists/english");
/**
 * Utility class for BIP-39 mnemonic generation and wordlist management.
 */
class MnemonicUtils {
    /**
     * Generates a new BIP-39 mnemonic phrase.
     *
     * @param {number} [strength=128] - Entropy strength in bits. Common values: 128 (12 words), 256 (24 words).
     * @returns {string} A mnemonic phrase.
     * @throws {Error} If the provided strength is invalid or unsupported.
     */
    static generateMnemonic(strength = 128) {
        const mnemonic = (0, bip39_1.generateMnemonic)(english_1.wordlist, strength);
        return mnemonic;
    }
    /**
     * Retrieves the full BIP-39 wordlist or filters it by a search term.
     *
     * @param {string} [searchTerm] - Optional term to filter words. Case-insensitive and trimmed.
     * @returns {string[]} A list of matching words, or the entire list if no search term is given.
     */
    static getWords(searchTerm) {
        if (!searchTerm)
            return english_1.wordlist;
        return english_1.wordlist.filter(w => {
            return w.includes(searchTerm.trim().toLowerCase());
        });
    }
    /**
    * Validates if the given mnemonic is valid according to BIP-39 rules.
    *
    * @param {string} mnemonic - The mnemonic phrase to validate.
    * @returns {boolean} True if valid, false otherwise.
    */
    static validateMnemonic(mnemonic) {
        return (0, bip39_1.validateMnemonic)(mnemonic, english_1.wordlist);
    }
    /**
    * Converts a mnemonic phrase to its entropy (hex string).
    *
    * @param {string} mnemonic - The mnemonic to convert.
    * @returns {Uint8Array} The Uint8Array entropy.
    * @throws {Error} If the mnemonic is invalid.
    */
    static mnemonicToEntropy(mnemonic) {
        if (!this.validateMnemonic(mnemonic))
            throw new Error('Invalid mnemonic.');
        return (0, bip39_1.mnemonicToEntropy)(mnemonic, english_1.wordlist);
    }
    /**
    * Converts entropy (hex string) to a BIP-39 mnemonic phrase.
    *
    * @param {Uint8Array} entropy - The entropy to convert.
    * @returns {string} The resulting mnemonic phrase.
    */
    static entropyToMnemonic(entropy) {
        this.validateEntropy(entropy);
        return (0, bip39_1.entropyToMnemonic)(entropy, english_1.wordlist);
    }
    /**
    * Converts a mnemonic phrase into a BIP-39 seed.
    *
    * @param {string} mnemonic - The mnemonic phrase.
    * @param {string} [passphrase] - Optional passphrase.
    * @returns {Uint8Array} The resulting seed as a byte array.
    */
    static mnemonicToSeed(mnemonic, passphrase = '') {
        if (typeof passphrase !== 'string')
            throw new Error('Passphrase must be a string');
        if (!this.validateMnemonic(mnemonic))
            throw new Error('Invalid mnemonic');
        return (0, bip39_1.mnemonicToSeedSync)(mnemonic, passphrase);
    }
    /**
    * Returns a random word from the BIP-39 wordlist.
    *
    * @returns {string} A randomly selected word.
    */
    static getRandomWord() {
        const index = Math.floor(Math.random() * english_1.wordlist.length);
        return english_1.wordlist[index];
    }
    static validateEntropy(entropy) {
        const validLengths = [16, 20, 24, 28, 32];
        if (!validLengths.includes(entropy.length))
            throw new Error("Invalid size entropy");
        if (this.isHighlyRepetitive(entropy))
            throw new Error("Low entropy, unsafe entropy level");
        // if(!this.isEntropyStrong(entropy))
        //     throw new Error("Low entropy, unsafe entropy level")
    }
    static isHighlyRepetitive(entropy) {
        const counts = new Map();
        for (const byte of entropy) {
            counts.set(byte, (counts.get(byte) || 0) + 1);
        }
        // if 90% or more bytes are equals, is suspect
        return [...counts.values()].some(count => count / entropy.length >= 0.9);
    }
    static isEntropyStrong(entropy, minEntropyBits = 7.5) {
        const perByteEntropy = this.calculateShannonEntropy(entropy) / entropy.length;
        return perByteEntropy >= minEntropyBits; // típico: >= 7.5 de 8
    }
    static calculateShannonEntropy(data) {
        const len = data.length;
        const freq = {};
        for (const byte of data) {
            freq[byte] = (freq[byte] || 0) + 1;
        }
        let entropy = 0;
        for (const byte in freq) {
            const p = freq[byte] / len;
            entropy -= p * Math.log2(p);
        }
        return entropy * 8; // bits de entropia por bloco total
    }
}
exports.MnemonicUtils = MnemonicUtils;
//# sourceMappingURL=mnemonic.js.map