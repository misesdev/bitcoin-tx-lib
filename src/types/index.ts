
type Bytes = Uint8Array;

export type BNetwork = "testnet" | "mainet"

export interface InputTransaction {
    txid: string,
    txindex: number,
    scriptPubkey: string,
    sequence?: number,
}

export interface InputScript {
    hexTxid: string,
    hexTxindex: string,
    hexScript: string,
    hexScriptLength: string,
    hexSequence: string
}

export interface OutputTransaction {
    value: number,
    address: string
}

export interface OutPutScript {
    hexValue: string,
    hexScriptLength: string,
    hexScript: string
}

export interface Transaction {
    version: number,
    inputs: InputTransaction[],
    outputs: OutputTransaction[],
    locktime: number
}

export type Hex = Bytes | string;

export type Key = Hex | bigint

export interface ECOptions {
    network?: BNetwork,
    privateKey?: Hex
}

