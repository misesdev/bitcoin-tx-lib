
# HDWallet

A TypeScript class for managing hierarchical deterministic (HD) wallets following BIP32/BIP44 standards. It supports generation, import, and derivation of Bitcoin addresses and keys, including watch-only (xpub-based) functionality.

## Features

* Create a new HD wallet from a randomly generated mnemonic (BIP39).
* Import from mnemonic, xpriv, or xpub.
* Derive public/private keys and addresses.
* Support for receive/change paths (BIP44).
* Network selection (mainnet or testnet).
* Watch-only support (from xpub).

## Installation

```bash
npm install your-hdwallet-library
```

## Usage

### Import

```ts
import { HDWallet } from "./hdwallet";
```

---

## API

### Create a New Wallet

```ts
const { mnemonic, hdwallet } = HDWallet.create("optional-password", { network: "testnet" });

console.log(mnemonic);
console.log(hdwallet.getXPriv());
```

### Import Wallet

You can import from a mnemonic, xpriv, or xpub:

```ts
const fromMnemonic = HDWallet.import("your seed phrase here", "optional-password");

const fromXPriv = HDWallet.import("xprv...", undefined, { network: "mainnet" });

const fromXPub = HDWallet.import("xpub...", undefined, { network: "mainnet" });
```

---

### Derive Addresses

#### List Receive Addresses

Returns external addresses for receiving payments.

```ts
const addresses = hdwallet.listReceiveAddresses(5, "p2wpkh", 0);
```

* `quantity`: number of addresses
* `type`: "p2wpkh" | "p2pkh" | etc.
* `account`: account index (default: 0)

#### List Change Addresses

Returns internal addresses for change outputs.

```ts
const changeAddresses = hdwallet.listChangeAddresses(3, "p2wpkh", 0);
```

---

### Get Specific Address

```ts
const addr = hdwallet.getAddress(0, "p2wpkh", { account: 0, change: 0 });
```

---

### Get Key Information

```ts
hdwallet.getMasterPrivateKey(); // Uint8Array
hdwallet.getMasterPublicKey();  // Uint8Array

hdwallet.getPrivateKey(0);
hdwallet.getPublicKey(0);
hdwallet.getPairKey(0);

hdwallet.getXPriv(); // throws if watch-only
hdwallet.getXPub();
```

---

## Path Derivation Structure

The wallet follows the BIP44 derivation structure:

```
m / purpose' / coin_type' / account' / change / address_index
```

* `purpose`: Usually `44'`
* `coin_type`: `0'` for Bitcoin mainnet, `1'` for testnet
* `account`: Logical separation between different wallets or purposes
* `change`: `0` for receive, `1` for change
* `index`: Incrementing index for addresses

If using a **watch-only wallet**, only non-hardened paths are supported.

---

## Watch-Only Support

When a wallet is imported from an `xpub`, it is in **watch-only** mode:

```ts
const { hdwallet } = HDWallet.import("xpub...");
console.log(hdwallet.isWatchOnly); // true

hdwallet.getPublicKey(0); // works
hdwallet.getPrivateKey(0); // throws
hdwallet.getXPriv(); // throws
```

---

## Example: Managing Multiple Accounts

```ts
// Account 0 - personal wallet
const personal = hdwallet.listReceiveAddresses(3, "p2wpkh", 0);

// Account 1 - business wallet
const business = hdwallet.listReceiveAddresses(3, "p2wpkh", 1);

// Change addresses for account 0
const change = hdwallet.listChangeAddresses(2, "p2wpkh", 0);
```

---

## Error Handling

Some actions throw errors if used improperly:

* Trying to access private keys in watch-only mode
* Deriving with invalid mnemonic
* Deriving from hardened paths in xpub-based wallets

Example:

```ts
try {
  hdwallet.getPrivateKey(0);
} catch (e) {
  console.error(e.message); // The wallet only has the public key, it is read-only
}
```

---

## Types

### `TypeAddress`

Supported types:

* `"p2wpkh"` (default)
* `"p2pkh"`
* `"p2sh"`
* Extendable for other output scripts.

### `PathOptions`

```ts
interface PathOptions {
  account?: number;
  change?: 0 | 1;
}
```

Used to customize BIP44 derivation path.

---

## License

MIT

---

