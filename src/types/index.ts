
type Bytes = Uint8Array;

export interface InputTransaction {
    txid: string,
    txindex: number,
    scriptPubkey: string,
    sequence: number,
}

export interface OutputTransaction {
    value: number,
    scriptPubkey: string
}

export interface Transaction {
    version: number,
    inputs: InputTransaction[],
    outputs: OutputTransaction[],
    locktime: number
}

export type Hex = Bytes | string;

export type Key = Hex | bigint

