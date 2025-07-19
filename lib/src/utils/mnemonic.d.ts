/**
 * Utility class for BIP-39 mnemonic generation and wordlist management.
 */
export declare class MnemonicUtils {
    /**
     * Generates a new BIP-39 mnemonic phrase.
     *
     * @param {number} [strength=128] - Entropy strength in bits. Common values: 128 (12 words), 256 (24 words).
     * @returns {string} A mnemonic phrase.
     * @throws {Error} If the provided strength is invalid or unsupported.
     */
    static generateMnemonic(strength?: 128 | 256): string;
    /**
     * Retrieves the full BIP-39 wordlist or filters it by a search term.
     *
     * @param {string} [searchTerm] - Optional term to filter words. Case-insensitive and trimmed.
     * @returns {string[]} A list of matching words, or the entire list if no search term is given.
     */
    static getWords(searchTerm?: string): string[];
    /**
    * Validates if the given mnemonic is valid according to BIP-39 rules.
    *
    * @param {string} mnemonic - The mnemonic phrase to validate.
    * @returns {boolean} True if valid, false otherwise.
    */
    static validateMnemonic(mnemonic: string): boolean;
    /**
    * Converts a mnemonic phrase to its entropy (hex string).
    *
    * @param {string} mnemonic - The mnemonic to convert.
    * @returns {Uint8Array} The Uint8Array entropy.
    * @throws {Error} If the mnemonic is invalid.
    */
    static mnemonicToEntropy(mnemonic: string): Uint8Array;
    /**
    * Converts entropy (hex string) to a BIP-39 mnemonic phrase.
    *
    * @param {Uint8Array} entropy - The entropy to convert.
    * @returns {string} The resulting mnemonic phrase.
    */
    static entropyToMnemonic(entropy: Uint8Array): string;
    /**
    * Converts a mnemonic phrase into a BIP-39 seed.
    *
    * @param {string} mnemonic - The mnemonic phrase.
    * @param {string} [passphrase] - Optional passphrase.
    * @returns {Uint8Array} The resulting seed as a byte array.
    */
    static mnemonicToSeed(mnemonic: string, passphrase?: string): Uint8Array;
    /**
    * Returns a random word from the BIP-39 wordlist.
    *
    * @returns {string} A randomly selected word.
    */
    static getRandomWord(): string;
    private static validateEntropy;
    private static isHighlyRepetitive;
    private static isEntropyStrong;
    private static calculateShannonEntropy;
}
