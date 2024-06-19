
import { ECPairKey } from "./ecpairkey";
import { P2WPKH } from "./p2wpkh";

let pairKey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", { network: "testnet" })

let transaction = new P2WPKH(pairKey)

transaction.addInput({ // 3990 sats
    txid: "b45ede2886cac1c6b7835f86bf549b3cfaaf326e14865b2952a6bce399f64e03",
    scriptPubkey: "51200683f3cb53225bcc286ade76026ff7a186b43349c532892c6c3ada4e334a4176",
    txindex: 1    
})

transaction.addInput({ // 1000 sats
    txid: "e9a119d81f1a2a720ab27ec815107f992564b067689603202e4791903a28ec82",
    scriptPubkey: "51201747e5f7f90ab48edc131a0fc18fe5ae45654899557a510babf937a4d99ac86f",
    txindex: 0
})

transaction.addInput({ // 4990 sats
    txid: "eb7a011f410205363b01d401742e0f397ffd692e966ffdd7695a7f3346d1b0e8",
    scriptPubkey: "0014b23d060e82d6a72e5f2b1b81cb88f26b2d6093af",
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

describe("P2WPKH transaction", () => {
    it("build signature", () => {

        transaction.build()

        transaction.generateSignatures()

        let scriptSig = transaction.inputScripts[0].hexScriptSig

        expect(scriptSig).toBe(`4830450220488e8f877bc28888827667fab0f163b205534fcc889cd1b9405d17e0dec2e5620221
            00efebd94af00e4605f4dcee7736eb9dadbb5a392574f7fe1fde77ccfe98f9f3de01210333b81ed541c4beee28783890c0
            13f1e5dd4eb38f60b78a4d30b5cad26996217f`.replace(/\s/g, ""))
    })
})