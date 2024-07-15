
type Bytes = Uint8Array;

export type BNetwork = "testnet" | "mainnet"

export type BechEncoding = "bech32" | "bech32m"

export type Bech32Options = {
    network?: BNetwork,
    version?: number,
    publicKey: string
}

interface InTransaction {
    txid: string,
    txindex: number,
    scriptPubkey?: string
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
    hexTxid: Uint8Array,
    hexTxindex: Uint8Array,
    hexScript: Uint8Array,
    hexScriptToSig?: Uint8Array,
    hexScriptLength: Uint8Array,
    hexSequence: Uint8Array,
    hexScriptSig?: Uint8Array,
    hexValue?: Uint8Array,
    isSegwit?: boolean
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
    hexValue: Uint8Array,
    hexScriptLength: Uint8Array,
    hexScript: Uint8Array
}

export interface ECOptions {
    network?: BNetwork,
    privateKey?: string
}


