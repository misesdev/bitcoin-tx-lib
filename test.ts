
import { Base58 } from "./src/base/base58";
import { Bech32 } from "./src/base/bech32";
import { ECPairKey } from "./src/ecpairkey";
import { P2WPKH } from "./src/p2wpkh";

let pairKey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", { network: "testnet" })

let bech32 = new Bech32({
    publicKey: Base58.decode(pairKey.getPublicKeyCompressed()),
    network: pairKey.network
})

let tx = new P2WPKH(pairKey)

tx.addInput({ // 3990 sats
    txid: "b45ede2886cac1c6b7835f86bf549b3cfaaf326e14865b2952a6bce399f64e03",
    scriptPubkey: "51200683f3cb53225bcc286ade76026ff7a186b43349c532892c6c3ada4e334a4176",
    txindex: 1    
})

tx.addInput({ // 1000 sats
    txid: "e9a119d81f1a2a720ab27ec815107f992564b067689603202e4791903a28ec82",
    scriptPubkey: "51201747e5f7f90ab48edc131a0fc18fe5ae45654899557a510babf937a4d99ac86f",
    txindex: 0
})

tx.addInput({ // 4990 sats
    txid: "eb7a011f410205363b01d401742e0f397ffd692e966ffdd7695a7f3346d1b0e8",
    scriptPubkey: "0014b23d060e82d6a72e5f2b1b81cb88f26b2d6093af",
    txindex: 0
})

tx.addOutput({ // receiver
    address: "tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q",
    value: 6000,
})

tx.addOutput({ // change 
    address: pairKey.getAddress(true), // bech32
    value: 2980,
})

// console.log("address:", pairKey.getAddress(true))
// console.log("txid:", tx.getTxid())
// console.log("tx row:", tx.build())

console.log(bech32.getScriptPubkey("tb1qt9xzu0df95vsfal8eptzyruv4e00k4ty6d8zhh"))
