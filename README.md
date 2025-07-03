# bitcoin-tx-lib

A TypeScript library for building Bitcoin transactions, focused on compatibility 
across any TypeScript environment, with minimal dependencies and built in pure
TypeScript. Fully compatible with React, React Native, and any TypeScript projects, 
with no reliance on native modules.

## Index

- [Manage Pair Key](#manage-pair-key)
  - [How to create and import key pair from different sources](#how-to-create-and-import-key-pair-from-different-sources)
  - [How to extract key pair information](#how-to-extract-key-pair-information)
- [How to set up a transaction](#how-to-set-up-a-transaction)
  - [Transaction](#transaction)
  - [Network fee](#network-fee)
- [How to use Hierarchical Deterministic Keys](hdkmanager.md)
- [How to use HD Wallet functions](hdwallet.md)
- [Building an HD Bitcoin Wallet with `bitcoin-tx-lib`](wallet.md)

## Install 

```bash
    npm install bitcoin-tx-lib
```

`Sample examples`

## Manage Pair Key

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

    // private key hexadecimal Uint8Array 
    // use the `Hex` suffix to get a hexadecimal string example getPrivateKeyHex()
    const privateKey: string = pairKey.getPrivateKey()

    // get hexadecimal public key Uint8Array 
    // use the `Hex` suffix to get a hexadecimal string example getPublicKeyHex()
    const publicKey: string = pairKey.getPublicKey()

    // get address 
    const address = pairKey.getAddress("p2wpkh")
    const address = pairKey.getAddress("p2pkh")
```

# How to set up a transaction

### Transaction 

Currently, only P2PKH and P2WPKH transaction types are accepted.
The Transaction class recognizes and processes them automatically.

```typescript
    import { ECPairKey, Transaction } from 'bitcoin-tx-lib'

    var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ", {
        network: "testnet"
    })

    var transaction = new Transaction(pairKey)

    transaction.version = 2 // This line is optional, this is the default value
    transaction.locktime = 0 // This line is optional, this is the default value

    transaction.addInput({
        txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
        scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
        value: 15197, 
        vout: 1
    })

    transaction.addOutput({
        address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
        amount: 15197 - 2000 /// fee 1000 sats  
    })

    // If the value has change.
    transaction.addOutput({
        address: pairKey.getAddress("p2wpkh"), // Your address to receive your change
        value: 1000 // Amount in sats
    })

    var transactionRow = transaction.getRawHex() // return transaction raw in string hexadecimal signed
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

### Network fee

To automatically handle the network fee, simply define who will pay the fee when
instantiating the `Transaction`, distribute the total of the inputs among the outputs, and
call the `resolveFee()` method:

```typescript
    var transaction = new Transaction(pairKey, {
        whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
        fee: 1, // estimated rate of 1 sat/vb
    })
    
    transaction.addInput({
        txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
        scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
        value: 30000, // total input value 
        vout: 1
    })
    // distributes the total of the inputs to the outputs, the fee will be automatically removed
    // from the specific output defined when calling resolveFee():
    transaction.addOutput({
        address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
        amount: 15000 
    })
    transaction.addOutput({
        address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
        amount: 15000 
    })
    // Decrements the output fee for "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf" as defined 
    // in the whoPayTheFee property of Transaction
    transaction.resolveFee() 

    const row = transaction.getRawHex()
```
>   Now, the execution of resolveFee() is unecessary, it will be executed automatically if you have passed the 
`whoPayTheFee` and `fee` parameters. now just run getRawHex().

You can set `whoPayTheFee` to `"everyone"`, so when `resolveFee()` is executed, the fee will
be evenly distributed among all transaction outputs. For example, if the fee is 240 satoshis 
and the transaction has 2 outputs, each output will pay 120 satoshis.

```typescript
    var transaction = new Transaction(pairKey, {
        whoPayTheFee: "everyone",
        fee: 1, // estimated rate of 1 sat/vb
    })
    
    //....
    transaction.resolveFee()

```

`**Note**`: By default, the transaction is created with Replace-By-Fee enabled to 
prevent it from getting stuck in the mempool due to very low fees. This allows you 
to rebuild the same transaction with a higher fee and send it again, overwriting 
the previous one. To disable Replace-By-Fee, simply set the 
sequence to 0xffffffff in the input.

