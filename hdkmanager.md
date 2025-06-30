Here is a **simple documentation in English** for the `HDKManager` class from the `bitcoin-tx-lib` library:

---

# `HDKManager` – Hierarchical Deterministic Key Manager

The `HDKManager` class allows you to derive Bitcoin key pairs from a master seed or mnemonic phrase using BIP44 paths. It provides an easy way to manage HD wallets by generating multiple key pairs and addresses from a single root.

### ✅ Import

```ts
import { HDKManager } from 'bitcoin-tx-lib';
```

---

## 📦 Constructor

```ts
new HDKManager({
  masterSeed: Uint8Array,
  purpose?: number,    // default: 44
  coinType?: number,   // default: 0 (Bitcoin)
  account?: number,    // default: 0
  change?: number      // default: 0
})
```

Creates a new HD wallet manager from a raw master seed (as bytes). Optionally, you can override BIP44 path parts.

---

## 🏁 Static Methods

### `HDKManager.fromMasterSeed(seed: string)`

Creates an `HDKManager` instance from a hex string master seed.

```ts
const hdk = HDKManager.fromMasterSeed("your_seed_hex_string");
```

### `HDKManager.fromMnemonic(mnemonic: string, password?: string)`

Creates an `HDKManager` instance from a BIP39 mnemonic phrase.

```ts
const hdk = HDKManager.fromMnemonic("seed phrase example here");
```

---

## 🔑 Key Derivation

### `getKey(index: number): Uint8Array`

Derives the private key at the path:

```
m / purpose' / coinType' / account' / change / index
```

Returns the raw private key as a `Uint8Array`.

---

## 📜 Batch Key Listing

### `listHDKeys(quantity: number): Uint8Array[]`

Returns an array of raw private keys for indexes `0` to `quantity - 1`.

```ts
const keys = hdk.listHDKeys(5); // returns 5 private keys
```

---

## 🔐 ECPairKey Generation

### `getPairKey(index: number, network?: "mainnet" | "testnet") : ECPairKey`

Returns an `ECPairKey` instance from the private key derived at the given index.

```ts
const pairKey = hdk.getPairKey(0); // get mainnet pair key at index 0
```

---

## 🔁 Batch Pair Key Listing

### `listPairKeys(quantity: number, network?: "mainnet" | "testnet"): ECPairKey[]`

Returns a list of `ECPairKey` objects derived from the first `quantity` indexes.

```ts
const pairKeys = hdk.listPairKeys(3, "testnet");
```

---

## 📌 Notes

* Follows [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) standard path derivation.
* Defaults:

  * `purpose`: 44
  * `coinType`: 0 (Bitcoin mainnet)
  * `account`: 0
  * `change`: 0 (external chain)
* Will throw an error if a private key is not found at the derived path.

---

