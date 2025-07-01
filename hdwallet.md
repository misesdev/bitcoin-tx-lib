# HDWallet

`HDWallet` is a TypeScript class for managing Hierarchical Deterministic (HD) wallets with support for:

* BIP-39 mnemonic generation and validation
* xprv and xpub import
* Public/private key derivation
* Bitcoin address generation (`p2wpkh`, `p2pkh`, etc)
* Watch-only wallets
* BIP-32/44 path customization

---

## Installation

Install the library and required dependencies:

```bash
npm install bitcoin-tx-lib bip39
```

---

## Features

* Create new wallets using a random BIP-39 mnemonic
* Import existing wallets using mnemonic, xpriv, or xpub
* Support for mainnet and testnet
* Derive keys and addresses by index
* Watch-only wallet support using xpub
* Custom derivation paths using optional parameters

---

## Usage

### Create a New Wallet

```ts
import { HDWallet } from "bitcoin-tx-lib";

const { mnemonic, hdwallet } = HDWallet.create(undefined, { network: "mainnet" });

console.log("Mnemonic:", mnemonic);
console.log("First address:", hdwallet.getAddress(0));
```

---

### Import from Mnemonic

```ts
const mnemonic = "solution beach rail rubber waste ready firm rural remove utility bachelor olive";

const { hdwallet } = HDWallet.import(mnemonic, "", { network: "mainnet" });

console.log("Address:", hdwallet.getAddress(0));
```

---

### Import from xpriv

```ts
const xpriv = "xprv9s21ZrQH143K3...";

const { hdwallet } = HDWallet.import(xpriv, undefined, { network: "mainnet" });

console.log("xpub:", hdwallet.getXPub());
```

---

### Import from xpub (Watch-Only Wallet)

```ts
const xpub = "xpub6CUGRU...";

const { hdwallet } = HDWallet.import(xpub, undefined, { network: "mainnet" });

console.log("Is watch-only:", hdwallet.isWatchOnly);
console.log("Address:", hdwallet.getAddress(0));
```

---

## API Reference

### `HDWallet.create(password?: string, options?: HDWalletOptions): IHDWallet`

Creates a new HD wallet from a random BIP-39 mnemonic.

* `password` (optional): Optional passphrase for mnemonic seed derivation
* `options.network`: `"mainnet"` or `"testnet"`
* Returns: `{ mnemonic: string, hdwallet: HDWallet }`

---

### `HDWallet.import(input: string, password?: string, options?: HDWalletOptions): IHDWallet`

Automatically detects the input type and imports the wallet:

* If `input` is a BIP-39 mnemonic, it validates and derives the wallet
* If `input` is an xpriv or xpub, it parses accordingly
* Returns: `{ mnemonic?: string, hdwallet: HDWallet }`

---

### `hdwallet.getAddress(index: number, options?, pathOptions?)`

Derives an address at the specified index.

* `options.type`: `"p2wpkh"` (default), `"p2pkh"`, `"p2sh"`
* `pathOptions`: Optional overrides for purpose, account, coinType, etc
* Returns: a Bitcoin address string

---

### `hdwallet.listAddresses(quantity: number, options?, pathOptions?)`

Returns a list of derived addresses.

* `quantity`: Number of addresses to generate
* `options.type`: Address type
* `pathOptions`: Optional path configuration
* Returns: string\[]

---

### `hdwallet.getXPriv()`

Returns the extended private key (xprv). Throws if the wallet is watch-only.

---

### `hdwallet.getXPub()`

Returns the extended public key (xpub).

---

### `hdwallet.getPrivateKey(index: number, pathOptions?)`

Derives the private key at the given index. Throws if the wallet is watch-only.

* Returns: `Uint8Array`

---

### `hdwallet.getPublicKey(index: number, pathOptions?)`

Returns the public key for the given index.

---

### `hdwallet.getPairKey(index: number, pathOptions?)`

Returns an ECPairKey (public + private key) for signing or address derivation.

---

### `hdwallet.getMasterPrivateKey()` / `getMasterPublicKey()`

Returns the root keys in `Uint8Array` format.

---

### `hdwallet.isWatchOnly`

Returns `true` if the wallet was created from an xpub (public key only).

---

## Notes

* You can only derive **non-hardened paths** (e.g. `m/0/0`) when using an `xpub`.
* Hardened derivation (e.g. `m/44'/0'/0'`) requires an `xprv` or mnemonic.
* The default derivation path follows the BIP44 format:
  `m / purpose' / coin_type' / account' / change / address_index`

---

## License

MIT License

---

