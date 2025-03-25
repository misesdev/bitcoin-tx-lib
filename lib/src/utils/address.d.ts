import { BNetwork, TypeAddress } from "../types";
interface PubkeyProps {
    pubkey: string;
    type?: TypeAddress;
    network?: BNetwork;
}
interface HashProps {
    ripemd160: string;
    type?: TypeAddress;
    network?: BNetwork;
}
export declare class Address {
    private static addressPrefix;
    static fromPubkey({ pubkey, type, network }: PubkeyProps): string;
    static fromHash({ ripemd160, type, network }: HashProps): string;
    static getScriptPubkey(address: string): string;
    static getRipemd160(address: string): string;
    static isValid(address: string): boolean;
}
export {};
