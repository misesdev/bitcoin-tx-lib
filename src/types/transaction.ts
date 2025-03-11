
export interface InputTransaction {
    txid: string;
    vout: number;
    scriptPubKey: string;
    value: number;
}

export interface OutputTransaction {
    address: string;
    amount: number;
}

