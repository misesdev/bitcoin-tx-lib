
type Bytes = Uint8Array;

interface InTransaction {
    txid: string,
    txindex: number,
    scriptPubkey?: string
}

export type BNetwork = "testnet" | "mainnet"

export type BechEncoding = "bech32" | "bech32m"

export type Bech32Options = {
    network?: BNetwork,
    version?: number,
    publicKey: string
}

export interface InputLegacy extends InTransaction {
    sequence?: number
}

export interface InputSegwit extends InTransaction {
    sequence?: number,
    address?: string,
    value?: number
}

export interface InputScript {
    hexTxid: string,
    hexTxindex: string,
    hexScript: string,
    hexScriptToSig?: string,
    hexScriptLength: string,
    hexSequence: string,
    hexScriptSig?: string,
    hexValue?: string 
}

export interface InputTransaction extends InTransaction {
    sequence: number,
    isSegwit: boolean
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

export interface ECOptions {
    network?: BNetwork,
    privateKey?: string
}


