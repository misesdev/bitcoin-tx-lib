
export type Hex = Uint8Array | string

export type BNetwork = "testnet" | "mainnet"

export type BechEncoding = "bech32" | "bech32m"

export interface Bech32Options {
    network?: BNetwork,
    version?: number,
    publicKey: string
}

export interface ECOptions {
    network?: BNetwork,
    privateKey?: string
}

export interface InputTransaction {
    txid: string;
    vout: number;
    scriptPubKey: string;
    sequence?: string;
    value: number;
}

export interface OutputTransaction {
    address: string;
    amount: number;
}
