import { ECPairKey } from "./ecpairkey"
import { Transaction } from "./transaction"

describe("default transaction tests", () => {
    
    const pairkey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", {
        network: "testnet",
    })

    const transaction = new Transaction(pairkey)
    
    test("segwit transaction P2PWKH", () => {
        
        transaction.addInput({
            txid: "3c70b68362641d536744a0b35568b6e0d7be432d2d5113e646f3e8a64c2322c4",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 15427, 
            vout: 1
        })

        transaction.addInput({
            txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 15197, 
            vout: 1
        })

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (15427+15197) - 1000 
        })

        console.log(transaction.build())

        //expect(`02000000000102c422234ca6e8f346e613512d2d43bed7e0b66855b3a04467531d646283b6703c0100000000fffffffff7a4b9ec7ad26965d2c645395e9189a07a2278d589d82b606125db3c5ba17d150100000000ffffffff01b873000000000000160014aec042df56d9dc2fad0b30faf62eb94f07cba3cc02493046022100844a3e89510f8650b4aa8aa2c3389f5bc67134574337c6481079e9ef4abc2a86022100e9289e04a0456daa5f7755a39752ca18dcba3c6b1fa190bb6f950a7c951d952801410433b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217fd7b86df0956273ce9acd1aac6c2986a3a9bd342eaa0c35970f5cfb83b63e94650248304502210085e869abbfd4977b88d322f7318f9faa80494f19659ebc993adc180646fecb5302204e2c6da7ef72935e47bce393a47e3dabf8f06f6d357f7d5301d573c65c9700dd01410433b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217fd7b86df0956273ce9acd1aac6c2986a3a9bd342eaa0c35970f5cfb83b63e946500000000`).toBe(transaction.build())
    })

    test("transaction non segwit P2PKH", () => {
        //transaction.Clear()

        // transaction.addInput({

        // })

        // transaction.addInput({

        // })

        // transaction.addOutput({

        // })

        //const row = transaction.build()
    })

    // test("generate txid", () => {
    //     const txid = transaction.getTxid()

    //     expect(txid).toBe("3fb2659ef89985b8ba5b377a45743de4d73dabfeac446ae8c756125001419770")
    // })
})




