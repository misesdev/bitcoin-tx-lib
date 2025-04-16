import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction } from "../types";
export declare abstract class BaseTransaction {
    version: number;
    locktime: number;
    inputs: InputTransaction[];
    outputs: OutputTransaction[];
    protected fee?: number;
    protected whoPayTheFee?: string;
    protected cachedata: any;
    protected pairKey: ECPairKey;
    constructor(pairKey: ECPairKey);
    addInput(input: InputTransaction): void;
    addOutput(output: OutputTransaction): void;
    outputsRaw(): string;
}
