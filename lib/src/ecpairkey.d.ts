import { BNetwork, ECOptions, Hex, TypeAddress } from "./types";
export declare class ECPairKey {
    privateKey: string;
    network: BNetwork;
    cipherCurve: string;
    static wifPrefixes: {
        mainnet: number;
        testnet: number;
    };
    addressPrefix: {
        mainnet: number;
        testnet: number;
    };
    private elliptic;
    constructor(options?: ECOptions);
    getPublicKey(): string;
    getPublicKeyCompressed(type?: "hex" | "base58"): string;
    signDER(messageHash: Hex): Hex;
    verifySignature(messageHash: Hex, derSignature: Hex): boolean;
    getWif(): string;
    getPublicWif(): string;
    getAddress(type?: TypeAddress): string;
    static fromWif(wif: string, options?: ECOptions): ECPairKey;
    static fromHex({ privateKey, network }: ECOptions): ECPairKey;
    static verifyWif(wifHex: string): boolean;
}
