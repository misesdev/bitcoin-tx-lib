# bitcoin-tx-lib

A Typescript library for building and signing Bitcoin transactions

## Install 

```bash
    npm install bitcoin-tx-lib
```

## Manage Key Pair

#### How to create and import key pair from different sources

```typescript
    import { ECPairKey } from 'bitcoin-tx-lib'

    // Generate pairkey mainnet
    const pairKey = new ECPairKey() // default network mainnet

    // Generate pairkey testnet
    const pairKey = new ECPairKey({ network: "testnet" })

    // Generate pairkey from private key hexadecimal
    const pairKey = new ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d", network: "testnet" })

    // Get pairkey from WIF private key
    const pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ") // default network mainnet
```

#### How to extract key pair information

```typescript
    const pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ")

    // private key hexadecimal 
    const privateKey: string = pairKey.privateKey

    // get hexadecimal complete public key elliptic curve 0x04 + X + Y
    const publicKey: string = pairKey.getPublicKey()

    // get hexadecimal compressed public key elliptic curve 0x02 + X 
    const publicKey: string = pairKey.getPublicKeyCompressed()
```

# How to set up a transaction

#### Transaction P2PKH 

```typescript
    import { ECPairKey, P2PKH } from 'bitcoin-tx-lib'

    var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

    var transaction = new P2PKH(pairKey)

    transaction.version = 1 // This line is optional, this is the default value
    transaction.locktime = 0 // This line is optional, this is the default value

    transaction.addInput({
        scriptPubkey: "76a9146bf19e55f94d986b4640c154d86469934191951188ac", 
        txid: "f34e1c37e736727770fed85d1b129713ef7f300304498c31c833985f487fa2f3",
        txindex: 0
    })

    transaction.addOutput({
        address: "mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt", // Receiver address
        value: 25100000 // Amount in sats
    })

    transaction.addOutput({
        address: pairKey.getAddress(), // Your address to receive your change
        value: 61900000 // Amount in sats
    })

    var transactionRow = transaction.build() // return transaction row hexadecimal signed
    /*
        transactionRow: 0100000001f3a27f485f9833c8318c490403307fef1397121b5dd8fe70777236e7371c4ef3000000006b483045022027ebbe9ce8
        1ddc0333f19fbbce027a0ab0bc7a5ad684a83db85b222dc0ee2de4022100d6842b3a78d7d8184ea8a8a75474779dcb772820fd82ff3040aaa0358601
        9d5f012102d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cffffffff0217efee00000000001976a91418ba14b36822
        95cb05230e31fecb00089240660888ac3b084e00000000001976a914a65d1a239d4ec666643d350c7bb8fc44d288112888ac00000000
    */

   var txid = transaction.getTxid() // Calculate transaction id
   /*
        txid: 2de56daa25d88f200e81eea36a41d82a2394f50f80f0d72776443a6172e9c55d
   */
```