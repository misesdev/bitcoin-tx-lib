
type InputTransaction = {
    txid: string,
    txindex: number,
    scriptPubkey: string,
    sequence: number,
}

type OutputTransaction = {
    value: number,
    scriptPubkey: string
}

type Transaction = {
    version: number,
    inputs: InputTransaction[],
    outputs: OutputTransaction[],
    locktime: number
}