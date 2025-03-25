import { BNetwork, Bech32Options, BechEncoding, Hex } from "../types";
export declare class Bech32 {
    publicKey: string;
    version: number;
    network: BNetwork;
    encoding: BechEncoding;
    private encodings;
    private chars;
    private generator;
    constructor(options?: Bech32Options);
    convert(ripemd160: Hex): number[];
    getAddress(): string;
    private getEncodingConst;
    private polymod;
    private hrpExpand;
    verifyChecksum(data: number[]): boolean;
    createChecksum(data: number[]): number[];
    encode(data: number[]): string;
    decode(bechString: string): Uint8Array | null;
    getScriptPubkey(bech32Address: string): string;
}
