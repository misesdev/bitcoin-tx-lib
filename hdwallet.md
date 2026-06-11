# HDWallet

High-level HD wallet API built on top of `HDKManager`. Handles BIP39 mnemonics,
BIP32/44/84 key derivation, address generation, and watch-only mode for both mainnet and testnet.

## Import

```ts
import { HDWallet } from 'bitcoin-tx-lib'
```

---

## Creating a wallet

### New wallet (random mnemonic)

```ts
const { mnemonic, wallet } = HDWallet.create()

// With BIP39 passphrase and network
const { mnemonic, wallet } = HDWallet.create("my passphrase", {
    network: "mainnet",   // "mainnet" | "testnet"  (default: "mainnet")
    purpose: 84           // 44 | 84                (default: 84)
})

console.log(mnemonic)        // "word1 word2 ... word12"
console.log(wallet.getXPub()) // zpub... (BIP84 mainnet) or vpub... (BIP84 testnet)
```

> Save the mnemonic securely. It is the only way to restore the wallet.

### Import from mnemonic, extended private key, or extended public key

```ts
// From 12 or 24-word mnemonic
const { mnemonic, wallet } = HDWallet.import("word1 word2 ... word12", "passphrase", {
    network: "mainnet",
    purpose: 84
})

// From extended private key — purpose and network are inferred from prefix
const { wallet } = HDWallet.import("xprv9s21ZrQH143K...")   // BIP44 mainnet
const { wallet } = HDWallet.import("tprv8ZgxMBicQKsPd...")  // BIP44 testnet
const { wallet } = HDWallet.import("zprvAWgYBBk7JR8G...")   // BIP84 mainnet
const { wallet } = HDWallet.import("vprv9DMUxX4ShgxMK...")  // BIP84 testnet

// From extended public key — watch-only (purpose and network inferred from prefix)
const { wallet } = HDWallet.import("xpub661MyMwAqRbcE...")  // BIP44 mainnet, watch-only
const { wallet } = HDWallet.import("tpubD6NzVbkrYhZ4W...")  // BIP44 testnet, watch-only
const { wallet } = HDWallet.import("zpub6jftahH18ngZw...")  // BIP84 mainnet, watch-only
const { wallet } = HDWallet.import("vpub5SLqN2bLY4WeY...")  // BIP84 testnet, watch-only

// Override the inferred network
const { wallet } = HDWallet.import("tprv8ZgxMBicQKsPd...", undefined, { network: "mainnet" })
```

The `import()` method auto-detects the input format and infers `network` and `purpose` from
the extended key prefix. Explicit `options` take precedence over inferred values.

| Prefix | Standard | Network | Purpose |
|--------|----------|---------|---------|
| `xprv` / `xpub` | BIP44 | mainnet | 44 |
| `tprv` / `tpub` | BIP44 | testnet | 44 |
| `zprv` / `zpub` | BIP84 | mainnet | 84 |
| `vprv` / `vpub` | BIP84 | testnet | 84 |

---

## Address derivation

The address type is determined by the wallet's `purpose`:
- `purpose: 84` (default) → `p2wpkh` — bech32 addresses (`bc1…` mainnet / `tb1…` testnet)
- `purpose: 44` → `p2pkh` — legacy addresses (`1…` mainnet / `m…`/`n…` testnet)

### Receive addresses (external chain, change = 0)

```ts
// First 5 receive addresses from account 0
const addresses = wallet.listReceiveAddresses(5)

// From account 1
const addresses = wallet.listReceiveAddresses(5, 1)
```

### Change addresses (internal chain, change = 1)

```ts
const changeAddresses = wallet.listChangeAddresses(3)
const changeAddresses = wallet.listChangeAddresses(3, 2)  // account 2
```

### Custom path

```ts
const addresses = wallet.listAddresses(5, { account: 0, change: 0 })  // receive
const addresses = wallet.listAddresses(5, { account: 1, change: 1 })  // change, account 1
```

### Single address by index

```ts
const addr = wallet.getAddress(0)
const addr = wallet.getAddress(3, { account: 1, change: 1 })
```

---

## Key derivation

### Single key pair (for signing)

```ts
const pair = wallet.getPairKey(0)
const pair = wallet.getPairKey(2, { account: 1, change: 1 })

pair.getAddress("p2wpkh")   // address
pair.getWif()               // WIF (compressed)
pair.getPublicKey()         // Uint8Array
pair.getPrivateKey()        // Uint8Array
```

### Multiple key pairs

```ts
const pairs = wallet.listPairKeys(5)
const pairs = wallet.listPairKeys(5, { account: 0, change: 1 })
```

### Raw keys

```ts
// Derived keys at a specific index
const privKey: Uint8Array = wallet.getPrivateKey(0)
const pubKey:  Uint8Array = wallet.getPublicKey(0)

// Root master keys (not derived — depth 0)
const masterPriv: Uint8Array = wallet.getMasterPrivateKey()
const masterPub:  Uint8Array = wallet.getMasterPublicKey()
```

### Extended keys

The serialization prefix reflects the wallet's `purpose` and `network`:

```ts
const xprv: string = wallet.getXPriv()   // xprv/tprv/zprv/vprv
const xpub: string = wallet.getXPub()   // xpub/tpub/zpub/vpub
```

Example:
```ts
const { wallet: w } = HDWallet.import("your mnemonic", "", { network: "testnet", purpose: 44 })
console.log(w.getXPriv())  // → tprv...
console.log(w.getXPub())   // → tpub...
```

---

## Watch-only mode

When imported from an `xpub`/`tpub`/`zpub`/`vpub`, the wallet is in **watch-only** mode.
Public keys and addresses can be derived, but signing is not possible.

The network is correctly inferred from the key prefix, so addresses are generated
for the right network without needing to specify `options`:

```ts
// testnet watch-only — automatically generates tb1… addresses
const { wallet } = HDWallet.import("vpub5SLqN2bLY4WeY...")

console.log(wallet.isWatchOnly)    // true
console.log(wallet.network)        // "testnet"

wallet.listReceiveAddresses(5)     // [ "tb1q...", "tb1q...", ... ]
wallet.getPublicKey(0)             // Uint8Array (33 bytes)

wallet.getPairKey(0)               // throws: "The wallet only has the public key, it is read-only"
wallet.getPrivateKey(0)            // throws
wallet.getXPriv()                  // throws
```

> **Important**: `getXPub()` returns the **root** extended public key. Watch-only wallets
> imported from a root xpub use the relative path `m/change/index`, which differs from
> the hardened absolute path `m/purpose'/coinType'/account'/change/index` used by full
> wallets. To derive addresses that match a full wallet, use an **account-level** xpub
> (at `m/84'/0'/0'`) rather than the root xpub.

---

## Signing transactions

Use `getPairKey()` to get the signing key for a specific UTXO and pass it to `HDTransaction.addInput()`:

```ts
import { HDWallet, HDTransaction } from 'bitcoin-tx-lib'

const { wallet } = HDWallet.import("your mnemonic")

const tx = new HDTransaction({ fee: 2, whoPayTheFee: "everyone" })

tx.addInput({
    txid: "a3f9...",
    vout: 0,
    value: 50000,
    scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9"
}, wallet.getPairKey(0))

tx.addOutput({ address: "bc1qrecipient...", amount: 49000 })

tx.resolveFee()
tx.sign()

console.log(tx.getRawHex())
console.log(tx.getTxid())
```

---

## PathOptions

All derivation methods accept an optional `PathOptions` argument:

```ts
interface PathOptions {
    account?: number   // default: 0
    change?: number    // 0 = receive (external), 1 = change (internal)
}
```

---

## HDWalletOptions

```ts
interface HDWalletOptions {
    network?: "mainnet" | "testnet"   // default: inferred from key prefix, or "mainnet"
    purpose?: 44 | 84                 // default: inferred from key prefix, or 84
}
```

---

## Error handling

| Situation | Error |
|-----------|-------|
| Invalid mnemonic on `import()` | `"Invalid seed phrase (mnemonic)"` |
| Unsupported format on `import()` | `"Unsupported or invalid HD wallet data format..."` |
| Private key access on watch-only | `"The wallet only has the public key, it is read-only"` |

---

## API reference

| Method | Returns | Description |
|--------|---------|-------------|
| `HDWallet.create(passphrase?, options?)` | `{ mnemonic, wallet }` | Create new wallet |
| `HDWallet.import(input, password?, options?)` | `{ mnemonic?, wallet }` | Import from mnemonic / xprv / xpub |
| `wallet.listReceiveAddresses(qty, account?)` | `string[]` | Receive addresses (change=0) |
| `wallet.listChangeAddresses(qty, account?)` | `string[]` | Change addresses (change=1) |
| `wallet.listAddresses(qty, pathOptions?)` | `string[]` | Addresses with full path control |
| `wallet.listPairKeys(qty, pathOptions?)` | `ECPairKey[]` | Multiple signing key pairs |
| `wallet.getAddress(index, pathOptions?)` | `string` | Single address by index |
| `wallet.getPairKey(index, pathOptions?)` | `ECPairKey` | Single key pair for signing |
| `wallet.getPublicKey(index, pathOptions?)` | `Uint8Array` | Derived public key |
| `wallet.getPrivateKey(index, pathOptions?)` | `Uint8Array` | Derived private key |
| `wallet.getMasterPrivateKey()` | `Uint8Array` | Root private key (depth 0) |
| `wallet.getMasterPublicKey()` | `Uint8Array` | Root public key (depth 0) |
| `wallet.getXPriv()` | `string` | Extended private key (xprv/tprv/zprv/vprv) |
| `wallet.getXPub()` | `string` | Extended public key (xpub/tpub/zpub/vpub) |
| `wallet.isWatchOnly` | `boolean` | `true` when imported from xpub |
| `wallet.network` | `"mainnet" \| "testnet"` | Active network |
