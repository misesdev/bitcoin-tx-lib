
type Bytes = Uint8Array;

export type BNetwork = "testnet" | "mainnet"

export type BechEncoding = "bech32" | "bech32m"

export type Bech32Options = {
    network?: "mainnet" | "testnet",
    version?: number,
    publicKey: string
}

export interface InputLegacy {
    txid: string,
    txindex: number,
    scriptPubkey: string,
    sequence?: number
}

export interface InputSegwit {
    txid: string,
    txindex: number,
    scriptPubkey: string,
    sequence?: number,
    value?: number
}

export interface InputScript {
    hexTxid: string,
    hexTxindex: string,
    hexScript: string,
    hexScriptLength: string,
    hexSequence: string,
    hexScriptSig?: string,
    hexValue?: string 
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

// export interface Transaction {
//     version: number,
//     inputs: InputTransaction[],
//     outputs: OutputTransaction[],
//     locktime: number
// }

export type Hex = Uint8Array;

export type Key = Hex | bigint

export interface ECOptions {
    network?: BNetwork,
    privateKey?: string
}

