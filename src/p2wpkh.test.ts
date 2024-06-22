import { ECPairKey } from "./ecpairkey";
import { P2WPKH } from "./p2wpkh";

let pairKey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", { network: "testnet" })

let transaction = new P2WPKH(pairKey)

transaction.addInput({ // 3990 sats
    address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
    txid: "b45ede2886cac1c6b7835f86bf549b3cfaaf326e14865b2952a6bce399f64e03",
    scriptPubkey: "51200683f3cb53225bcc286ade76026ff7a186b43349c532892c6c3ada4e334a4176",
    value: 3990,
    txindex: 1    
})

transaction.addInput({ // 1000 sats
    address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
    txid: "e9a119d81f1a2a720ab27ec815107f992564b067689603202e4791903a28ec82",
    scriptPubkey: "51201747e5f7f90ab48edc131a0fc18fe5ae45654899557a510babf937a4d99ac86f",
    value: 1000,
    txindex: 0
})

transaction.addInput({ // 4990 sats
    address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
    txid: "eb7a011f410205363b01d401742e0f397ffd692e966ffdd7695a7f3346d1b0e8",
    scriptPubkey: "0014b23d060e82d6a72e5f2b1b81cb88f26b2d6093af",
    value: 4990,
    txindex: 0
})

transaction.addOutput({ // receiver
    address: "tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q",
    value: 6000,
})

transaction.addOutput({ // change 
    address: pairKey.getAddress(true), // bech32
    value: 2980,
})

// legacy d1a92ad68a031c5324981aa920152bd16975686905db41e3fc9d51c7ff4a20ed

// segwit b7203bd59b3c26c65699251939e1e6353f5f09952156c5b9c01bbe9f5372b89c

// segwit 04d984cdcf728975c173c45c49a242cedee2da5dc200b2f83ca6a98aecf11280

describe("P2WPKH transaction", () => {
    it("build signature", () => {

        transaction.build()

        transaction.generateSignatures()

        let scriptSig = transaction.inputScripts[0].hexScriptSig

        expect(scriptSig).toBe(`48304502210087e0a2f25cb51e8b980063614e69a89ac7f9634898b9c235cbd93019b885c97f0220300e4
            e13462a50f696b0ae65092164cd6781d0d3c2a8533aa3572d01cacc546d01210333b81ed541c4beee28783890c013f1e5dd4eb38f
            60b78a4d30b5cad26996217f`.replace(/\s/g, ""))
    })
    it("build transaction row", () => {
        
        expect(transaction.build()).toBe(`02000103000000b45ede2886cac1c6b7835f86bf549b3cfaaf326e14865b2952a6bce399f64e0
            301000000232251200683f3cb53225bcc286ade76026ff7a186b43349c532892c6c3ada4e334a4176ffffffffe9a119d81f1a2a720a
            b27ec815107f992564b067689603202e4791903a28ec8200000000232251201747e5f7f90ab48edc131a0fc18fe5ae45654899557a5
            10babf937a4d99ac86fffffffffeb7a011f410205363b01d401742e0f397ffd692e966ffdd7695a7f3346d1b0e80000000017160014
            b23d060e82d6a72e5f2b1b81cb88f26b2d6093afffffffff027017000000000000160014fcb55e6920e2c6f37327a5bf4a24cf42ebb
            af07ca40b000000000000160014a8439c50793b033df810de257b313144a8f7edc90248304502210087e0a2f25cb51e8b980063614e
            69a89ac7f9634898b9c235cbd93019b885c97f0220300e4e13462a50f696b0ae65092164cd6781d0d3c2a8533aa3572d01cacc546d0
            1210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f02483045022054ebdff10b1c8dc29494f5c86a
            f20d7779066ac4718cf55e6871209df4e0d7af0221009540cf3309b8ec38fcd94565e8f02745916272117ebac7be0ee766f5d243ff4
            301210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f02483045022100e1bc9bdd710cc17af92bee
            71a2369c93b876cc9e05a6bc8c94c8f0e8ce365d0e02200b45dfa1ebc83ae36a50dc462121c3a2b513d7c04c308a9bc01d0847115ad
            61601210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f00000000`.replace(/\s/g, ""))
        
        expect(transaction.getTxid()).toBe("af9da3413331f39c959d700e891e479331db66768b566236256aa878bce5b20b")
    })
})