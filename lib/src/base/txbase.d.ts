import { ECPairKey } from "../ecpairkey";
import { InputTransaction, OutputTransaction } from "../types";
export declare class BaseTransaction {
    version: number;
    locktime: number;
    pairKey: ECPairKey;
    cachedata: any;
    inputs: InputTransaction[];
    outputs: OutputTransaction[];
    constructor(pairKey: ECPairKey);
    addInput(input: InputTransaction): void;
    addOutput(output: OutputTransaction): void;
    outputsRaw(): string;
}
