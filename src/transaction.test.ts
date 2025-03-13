import { ECPairKey } from "./ecpairkey"
import { Transaction } from "./transaction"

const pairkey = ECPairKey.fromHex({
    privateKey: "9d01e9e28cba0217c5826838596733b2cf86a54fff3eabcabec90a2acdc101d8",
    network: "testnet"
})

const transaction = new Transaction(pairkey, { network: "testnet" })

describe("default transaction tests", () => {
    it("segwit transaction", () => {
        
        transaction.addInput({
            txid: "3c70b68362641d536744a0b35568b6e0d7be432d2d5113e646f3e8a64c2322c4",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 15427, //of 15427 -> 1000 sats to fee
            vout: 1
        })

        transaction.addInput({
            txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 15197, // all sats of this utxo
            vout: 1
        })

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (15427+15197) - 1000 
        })

        console.log(transaction.build())

        expect(`0200000000010201000000c422234ca6e8f346e613512d2d43bed7e0b66855b3a04467531d646283b6703c00ffffffff01000000f7a4b9ec7ad26965d2c645395e9189a07a2278d589d82b606125db3c5ba17d1500ffffffff01363000000000000023002100151b000405171a161b070e021f0b080b06031d0f0c0b1519091c031c17081e0c00028c493046022100cda70b4755a50531df3c18525231502e76c1afe04e45514f23b39e0e548efead022100d7126820540ea4ac30c44576b9030bb63f93cad2b24c36df904f42b2efdc56be01410433b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217fd7b86df0956273ce9acd1aac6c2986a3a9bd342eaa0c35970f5cfb83b63e9465028b483045022075dbfb24a963a3ac1c31a7f3245a5da941b26f4d1f82605aa3500d2adb1ab832022100b89e7760fceb0b730bf47bd382d2ec05bc753d3bc29aa122c5c6cec8c930a18d01410433b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217fd7b86df0956273ce9acd1aac6c2986a3a9bd342eaa0c35970f5cfb83b63e946500000000`).toBe(transaction.build())
    })
})




