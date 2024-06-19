import { ECPairKey } from "./src/ecpairkey";
import { P2WPKH } from "./src/p2wpkh";

let pairKey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g", { network: "testnet" })

let tx = new P2WPKH(pairKey)

tx.addInput({
    txid: "64c4fbbbe4eb026645ba3d81e0f126fc95d8636ac1f673604dc69d0fbfcf8dab",
    scriptPubkey: "0014cbb250720463cfbab23f16ec7d910630e03d23d2",
    txindex: 4    
})

tx.addInput({
    txid: "2feb47a936e56b3cdd3432b987907d2db5d85fe3a3cec73a06c4a15aeca5c45f",
    scriptPubkey: "5120592b8b694bee452cceaaeb718a623fab5ae6456ac3eff1d8fea851345c79803f",
    txindex: 0
})

tx.addOutput({
    address: "tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q",
    value: 6000,
})

tx.addOutput({
    address: pairKey.getAddress(true), // bech32
    value: 17010,
})

console.log("address:", pairKey.getAddress(true))
console.log("txid:", tx.getTxid())
console.log("tx row:", tx.build())
