
# Building an HD Bitcoin Wallet with `bitcoin-tx-lib`

This guide explains how to create and manage a complete **Hierarchical Deterministic (HD)** Bitcoin wallet using the `HDWallet` and `HDTransaction` classes from the `bitcoin-tx-lib` library. This includes mnemonic generation, key/address derivation, and transaction creation.

---

## Table of Contents

* [Installation](#installation)
* [Creating a New Wallet](#creating-a-new-wallet)
* [Importing a Wallet](#importing-a-wallet)
* [Deriving Addresses](#deriving-addresses)

  * [Receiving Addresses](#receiving-addresses)
  * [Change Addresses](#change-addresses)
* [Saving Derived Addresses](#saving-derived-addresses)
* [Signing Transactions](#signing-transactions)
* [Getting Transaction Info](#getting-transaction-info)
* [Fee Calculation](#fee-calculation)
* [Watch-Only Mode](#watch-only-mode)
* [API Reference](#api-reference)

---

## Installation

You can import the library into your TypeScript/JavaScript project:

```ts
import { HDWallet, HDTransaction } from "bitcoin-tx-lib"
```

---

## Creating a New Wallet

To create a brand-new HD wallet and generate a 12-word mnemonic:

```ts
const { mnemonic, hdwallet } = HDWallet.create("optional-password", {
  network: "mainnet" // or "testnet"
})

console.log("Mnemonic:", mnemonic)
```

> The generated mnemonic should be securely saved by the user. It can be used to restore the wallet later.

---

## Importing a Wallet

You can import an existing wallet using a mnemonic, xpriv, or xpub:

```ts
const { hdwallet } = HDWallet.import("your mnemonic or xpub/xpriv", "optional-password", {
  network: "mainnet"
})
```

---

## Deriving Addresses

### Receiving Addresses

```ts
const receiveAddresses = hdwallet.listReceiveAddresses(5, "p2wpkh", 0)
console.log("Receive Addresses:", receiveAddresses)
```

### Change Addresses

```ts
const changeAddresses = hdwallet.listChangeAddresses(5, "p2wpkh", 0)
console.log("Change Addresses:", changeAddresses)
```

---

## Saving Derived Addresses

> **Important**: You must save and manage the derived **receiving** and **change** addresses, including their derivation paths, indexes, and usage state. This is not handled internally by the library and is essential to avoid address reuse or missing funds.

---

## Signing Transactions

To build and sign a transaction using derived keys:

```ts
const pairKey = hdwallet.getPairKey(0) // Derive the key to spend from

const tx = new HDTransaction({
  fee: 20, // sat/vByte
  whoPayTheFee: "everyone"
})

// Add UTXOs as inputs
tx.addInput({
  txid: "faketxid...",
  vout: 0,
  amount: 100000,
  address: pairKey.getAddress("p2wpkh"),
  scriptPubKey: "0014abcd...", // from UTXO
  type: "p2wpkh"
}, pairKey)

// Add outputs
tx.addOutput({
  address: "bc1qrecipient...",
  amount: 95000
})

tx.sign()
```

---

## Getting Transaction Info

After signing, you can access transaction details:

```ts
const rawHex = tx.getRawHex()
const rawBytes = tx.getRawBytes()
const txid = tx.getTxid()

console.log("TXID:", txid)
```

---

## Fee Calculation

The library will compute the transaction weight and fee dynamically:

```ts
const weight = tx.weight()
const vbytes = tx.vBytes()
const fee = tx.getFeeSats()

console.log("Virtual Size:", vbytes, "bytes")
console.log("Fee:", fee, "satoshis")
```

You can also use:

```ts
tx.resolveFee()
```

This will automatically deduct the calculated fee from the outputs based on the strategy (e.g., from everyone or a specific address).

---

## Watch-Only Mode

You can import a wallet using an **xpub** and derive addresses without holding private keys:

```ts
const { hdwallet } = HDWallet.import("xpub6...", undefined, {
  network: "mainnet"
})

const watchOnly = hdwallet.isWatchOnly // true
const address = hdwallet.getAddress(0, "p2wpkh")
```

Watch-only wallets can generate addresses, but **cannot sign transactions**.

---

## API Reference

### `HDWallet.create(password?, options?)`

Generates a new wallet and returns `{ mnemonic, hdwallet }`.

---

### `HDWallet.import(input, password?, options?)`

Imports from mnemonic, xpriv, or xpub.

---

### `hdwallet.listReceiveAddresses(count, type, account?)`

Returns receiving addresses from `m/44'/0'/account'/0/i`.

---

### `hdwallet.listChangeAddresses(count, type, account?)`

Returns change addresses from `m/44'/0'/account'/1/i`.

---

### `hdwallet.getPairKey(index, pathOptions?)`

Returns an `ECPairKey` instance with private/public key for signing.

---

### `HDTransaction(options?)`

Creates a new HD transaction instance with optional options:

* `fee`: Fee per virtual byte
* `whoPayTheFee`: `"everyone"` or a specific address

---

### `tx.addInput(input: InputTransaction)`

### `tx.addOutput(output: OutputTransaction)`

### `tx.sign()`

### `tx.getTxid()`

### `tx.getRawHex()`

### `tx.getRawBytes()`

### `tx.weight()`

### `tx.vBytes()`

### `tx.resolveFee()`

### `tx.getFeeSats()`

Use these methods to build, sign, and inspect the transaction.

---

## Notes

* You must persist the wallet’s mnemonic and derived addresses.
* Index tracking is not handled automatically.
* This library is non-custodial and does not connect to any blockchain node. You must manage UTXO discovery and broadcasting externally.

---

## License

MIT

---

Let me know if you'd like this exported to a `.md` file or expanded with code examples.
