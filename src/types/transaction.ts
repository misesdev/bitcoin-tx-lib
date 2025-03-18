
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

