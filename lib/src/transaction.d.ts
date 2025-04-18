import { BaseTransaction } from "./base/txbase";
import { ECPairKey } from "./ecpairkey";
type BuildFormat = "raw" | "txid";
interface TXOptions {
    version?: number;
    locktime?: number;
    whoPayTheFee?: string;
    fee?: number;
}
export declare class Transaction extends BaseTransaction {
    constructor(pairkey: ECPairKey, options?: TXOptions);
    getFeeSats(): number;
    resolveFee(): void;
    build(format?: BuildFormat): string;
    getTxid(): string;
    private generateScriptSig;
    private generateWitness;
    isSegwit(): boolean;
    private isSegwitInput;
    weight(): number;
    vBytes(): number;
    clear(): void;
}
export {};
