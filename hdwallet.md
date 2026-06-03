# HDWallet

High-level HD wallet API built on top of `HDKManager`. Handles BIP39 mnemonics,
BIP32/44/84 key derivation, address generation, and watch-only mode.

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
    network: "mainnet",   // "mainnet" | "testnet" (default: "mainnet")
    purpose: 84           // 44 | 84 (default: 84)
})

console.log(mnemonic)        // "word1 word2 ... word12"
console.log(wallet.getXPub())
```

> Save the mnemonic securely. It is the only way to restore the wallet.

### Import from mnemonic, xpriv, or xpub

```ts
// From 12 or 24-word mnemonic
const { mnemonic, wallet } = HDWallet.import("word1 word2 ... word12", "passphrase", {
    network: "mainnet",
    purpose: 84
})

// From extended private key (xprv / tprv)
const { wallet } = HDWallet.import("xprv9s21ZrQH143K...", undefined, { network: "mainnet" })

// From extended public key — watch-only (xpub / tpub)
const { wallet } = HDWallet.import("xpub6CUGRUonZSQ4...", undefined, { network: "mainnet" })
```

The `import()` method auto-detects the input format by inspecting the first token(s).

---

## Address derivation

The address type is determined by the wallet's `purpose`:
- `purpose: 84` (default) → `p2wpkh` — bech32 addresses (`bc1…` / `tb1…`)
- `purpose: 44` → `p2pkh` — legacy addresses (`1…` / `m…` / `n…`)

### Receive addresses (external chain, change = 0)

```ts
// First 5 receive addresses from account 0
const addresses = wallet.listReceiveAddresses(5)

// From account 1
const addresses = wallet.listReceiveAddresses(5, 1)
```

### Change addresses (internal chain, change = 1)

```ts
// First 3 change addresses from account 0
const changeAddresses = wallet.listChangeAddresses(3)

// From account 2
const changeAddresses = wallet.listChangeAddresses(3, 2)
```

### Custom path

Use `listAddresses()` with explicit `PathOptions` for full control:

```ts
const addresses = wallet.listAddresses(5, { account: 0, change: 0 })  // receive
const addresses = wallet.listAddresses(5, { account: 1, change: 1 })  // change, account 1
```

### Single address by index

```ts
const addr = wallet.getAddress(0)                          // receive, account 0
const addr = wallet.getAddress(3, { account: 1, change: 1 })  // change, account 1
```

---

## Key derivation

### Single key pair (for signing)

```ts
const pair = wallet.getPairKey(0)                           // index 0, account 0
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

```ts
const xprv: string = wallet.getXPriv()   // base58-encoded xprv/tprv
const xpub: string = wallet.getXPub()   // base58-encoded xpub/tpub
```

---

## Watch-only mode

When imported from an `xpub`, the wallet is in **watch-only** mode.
Public keys and addresses can be derived, but signing is not possible.

```ts
const { wallet } = HDWallet.import("xpub6CUGRUonZSQ4...")

console.log(wallet.isWatchOnly)    // true

wallet.getPublicKey(0)             // OK
wallet.listReceiveAddresses(5)     // OK

wallet.getPairKey(0)               // throws: "The wallet only has the public key, it is read-only"
wallet.getPrivateKey(0)            // throws
wallet.getXPriv()                  // throws
```

---

## Signing transactions

Use `getPairKey()` to get the signing key for a specific UTXO and pass it to `HDTransaction.addInput()`:

```ts
import { HDWallet, HDTransaction } from 'bitcoin-tx-lib'

const { wallet } = HDWallet.import("your mnemonic")

const tx = new HDTransaction({ fee: 2, whoPayTheFee: "everyone" })

// Input controlled by derived key at index 0
tx.addInput({
    txid: "a3f9...",
    vout: 0,
    value: 50000,
    scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9"
}, wallet.getPairKey(0))

// Input controlled by a different derived key
tx.addInput({
    txid: "a3f9...",   // same txid — different vout is valid
    vout: 1,
    value: 30000
}, wallet.getPairKey(1))

tx.addOutput({ address: "bc1qrecipient...", amount: 79000 })

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
    network?: "mainnet" | "testnet"   // default: "mainnet"
    purpose?: 44 | 84                 // default: 84
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
| `wallet.getXPriv()` | `string` | Extended private key (base58) |
| `wallet.getXPub()` | `string` | Extended public key (base58) |
| `wallet.isWatchOnly` | `boolean` | `true` when imported from xpub |
| `wallet.network` | `"mainnet" \| "testnet"` | Active network |
