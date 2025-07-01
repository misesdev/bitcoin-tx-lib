import { BNetwork, ECOptions, TypeAddress } from "./types";
export declare class ECPairKey {
    readonly network: BNetwork;
    readonly privateKey: Uint8Array;
    static wifPrefixes: {
        mainnet: number;
        testnet: number;
    };
    constructor(options?: ECOptions);
    /**
    * Returns the compressed public key derived from the private key.
    */
    getPublicKey(): Uint8Array;
    getPrivateKey(): Uint8Array;
    /**
    * Signs a message hash and returns the DER-encoded signature.
    * @param message Hash of the message to sign.
    */
    signDER(message: Uint8Array): Uint8Array;
    /**
    * Verifies a DER-encoded signature against a message hash.
    * @param message Message hash that was signed.
    * @param signature Signature in DER format.
    */
    verifySignature(message: Uint8Array, signature: Uint8Array): boolean;
    /**
    * Returns the WIF (Wallet Import Format) of the private key.
    * @param compressed Whether to append 0x01 to indicate compressed public key.
    */
    getWif(): string;
    /**
   * Returns the address associated with the compressed public key.
   * @param type Type of address to generate (p2pkh, p2wpkh, etc).
   */
    getAddress(type?: TypeAddress): string;
    /**
    * Creates a key pair from a WIF string.
    * @param wif Wallet Import Format string.
    * @param options Optional network override.
    */
    static fromWif(wif: string): ECPairKey;
    /**
    * Creates a key pair from a raw private key.
    */
    static fromHex(privateKey: string, network?: BNetwork): ECPairKey;
    /**
    * Verifies if a WIF string (decoded) has valid prefix and checksum.
    * @param bytes WIF decoded into bytes.
    */
    static verifyWif(decoded: Uint8Array): boolean;
    getPrivateKeyHex(): string;
    getPublicKeyHex(): string;
}
