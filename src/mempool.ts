import mempool from "@mempool/mempool.js"
import { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses"

const { bitcoin: { addresses, transactions }} = mempool({
    hostname: "mempool.space"
})

export async function getUtxos(address: string): Promise<AddressTxsUtxo[]> {
    return await addresses.getAddressTxsUtxo({ address })
}

export async function sendTransaction(txhex: string) {
    const txid = await transactions.postTx({ txhex })
    return txid
}