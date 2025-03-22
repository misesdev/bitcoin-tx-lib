# bitcoin-tx-lib

A TypeScript library for building Bitcoin transactions, focused on compatibility 
across any TypeScript environment, with minimal dependencies and built in pure
TypeScript. Fully compatible with React, React Native, and any TypeScript projects, 
with no reliance on native modules.

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

    // get address 
    const address = pairKey.getAddress("p2wpkh")
    const address = pairKey.getAddress("p2pkh")
```

# How to set up a transaction

#### Transaction P2PKH 

**Currently, P2PKH and P2PWKH transaction types are not accepted, 
even though they are recognized and handled automatically by
the Transaction class.**

```typescript
    import { ECPairKey, Transaction } from 'bitcoin-tx-lib'

    var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", { network: "testnet" })

    var transaction = new Transaction(pairKey)

    transaction.version = 1 // This line is optional, this is the default value
    transaction.locktime = 0 // This line is optional, this is the default value

    transaction.addInput({
        txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
        scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
        value: 15197, 
        vout: 1
    })

    transaction.addOutput({
        address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
        amount: 15197 - 1000 /// fee 1000 sats  
    })

    // If the value has change.
    transaction.addOutput({
        address: pairKey.getAddress("p2wpkh"), // Your address to receive your change
        value: 1000 // Amount in sats
    })

    var transactionRow = transaction.build() // return transaction row hexadecimal signed
    /*
        transactionRow: 02000000000101c6be2d35cce2b9def60ea1d1923bc6566fc2c8d30fb3d76a843
        92343855ead6f0100000000ffffffff01d00c000000000000160014aec042df56d9dc2fad0b30faf6
        2eb94f07cba3cc02483045022100bd4f1ff33aadc704173d31246e45a77cafee0a9534ab1383ce95c
        e163870783402203fc6d5321dfbdacac0874d1acf48e7a03087daf7690225216491660584e6e8c401
        210333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f00000000
    */

   var txid = transaction.getTxid() // Calculate transaction id
   /*
        txid: 7c850c5f558d3ea982f2b1a940f4ec40104841793029302fbcb8958595066eaf
   */
```

**Warning**: Do not use this library outside a server environment. It is not designed 
for performance. If performance is one of your requirements, consider using a 
specialized library. At least for now, this implementation focuses on compatibility 
across Node.js, React Native, React, etc.
