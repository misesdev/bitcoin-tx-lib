# Building a Bitcoin Wallet with bitcoin-tx-lib

A practical guide covering the full workflow: wallet creation, address derivation,
UTXO management, transaction building, and fee handling.

---

## Table of Contents

- [Installation](#installation)
- [Creating a wallet](#creating-a-wallet)
- [Importing a wallet](#importing-a-wallet)
- [Deriving addresses](#deriving-addresses)
- [Building transactions](#building-transactions)
  - [Single-key transaction (Transaction)](#single-key-transaction)
  - [Multi-key HD transaction (HDTransaction)](#multi-key-hd-transaction)
  - [Spending multiple UTXOs from the same parent tx](#spending-multiple-utxos-from-the-same-parent-tx)
- [Fee management](#fee-management)
- [Inspecting a signed transaction](#inspecting-a-signed-transaction)
- [Watch-only wallets](#watch-only-wallets)
- [Key types reference](#key-types-reference)
- [Important notes](#important-notes)

---

## Installation

```bash
npm install bitcoin-tx-lib
```

```ts
import { HDWallet, HDTransaction, Transaction, ECPairKey } from 'bitcoin-tx-lib'
```

---

## Creating a wallet

```ts
// BIP84 (native SegWit, bc1… addresses) — default
const { mnemonic, wallet } = HDWallet.create()

// BIP44 (legacy P2PKH, 1… addresses)
const { mnemonic, wallet } = HDWallet.create(undefined, { purpose: 44 })

// Testnet + passphrase
const { mnemonic, wallet } = HDWallet.create("my passphrase", {
    network: "testnet",
    purpose: 84
})

console.log(mnemonic)        // "word1 word2 … word12"  — SAVE THIS
console.log(wallet.getXPub())
```

---

## Importing a wallet

```ts
// From 12 or 24-word mnemonic
const { wallet } = HDWallet.import(
    "word1 word2 … word12",
    "optional passphrase",
    { network: "mainnet", purpose: 84 }
)

// From xprv (full signing capability)
const { wallet } = HDWallet.import("xprv9s21ZrQH143K…")

// From xpub (watch-only, addresses only)
const { wallet } = HDWallet.import("xpub6CUGRUonZSQ4…")
```

---

## Deriving addresses

```ts
// First 5 receive addresses (BIP84 → tb1… / bc1…)
const receiveAddresses = wallet.listReceiveAddresses(5)

// First 3 change addresses
const changeAddresses = wallet.listChangeAddresses(3)

// Account 1 receive addresses
const account1 = wallet.listReceiveAddresses(5, 1)

// Single address by index
const addr0 = wallet.getAddress(0)
```

> **You are responsible for tracking which addresses and indexes you have used.**
> The library does not persist state or connect to any blockchain node.

---

## Building transactions

### InputTransaction fields

```ts
interface InputTransaction {
    txid: string        // Transaction ID of the UTXO being spent (64 hex chars)
    vout: number        // Output index within that transaction
    value: number       // UTXO value in satoshis
    scriptPubKey?: string  // Hex-encoded scriptPubKey (auto-derived from key if omitted)
    sequence?: string   // Sequence number in hex (default: "fffffffd" — RBF enabled)
}
```

### OutputTransaction fields

```ts
interface OutputTransaction {
    address: string  // Recipient Bitcoin address (P2PKH or P2WPKH)
    amount: number   // Amount in satoshis
}
```

---

### Single-key transaction

Use `Transaction` when all UTXOs belong to the same key pair.

```ts
import { ECPairKey, Transaction } from 'bitcoin-tx-lib'

const pairKey = ECPairKey.fromWif("cNk5Vf4VwDPSUFqn4JzwGJHpNMm5mWnHSTRFDWJZm7jdHrr5Uef")

const tx = new Transaction(pairKey)

tx.addInput({
    txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
    vout: 0,
    value: 50000
    // scriptPubKey is optional — auto-generated from pairKey
})

tx.addOutput({
    address: "tb1qrecipient...",
    amount: 49000  // value minus fee
})

tx.sign()

console.log(tx.getRawHex())  // broadcast this
console.log(tx.getTxid())
```

---

### Multi-key HD transaction

Use `HDTransaction` when inputs are controlled by different derived keys.

```ts
import { HDWallet, HDTransaction } from 'bitcoin-tx-lib'

const { wallet } = HDWallet.import("your mnemonic here")

const tx = new HDTransaction()

tx.addInput({
    txid: "a1b2c3d4…",
    vout: 0,
    value: 30000,
    scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9"
}, wallet.getPairKey(0))   // key at derivation index 0

tx.addInput({
    txid: "e5f6a7b8…",
    vout: 1,
    value: 20000
}, wallet.getPairKey(3))   // key at derivation index 3

tx.addOutput({
    address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
    amount: 49500
})

tx.sign()

console.log(tx.getRawHex())
console.log(tx.getTxid())
```

---

### Spending multiple UTXOs from the same parent tx

Bitcoin allows spending multiple outputs from the same transaction.
The library distinguishes inputs by `txid + vout`, so the same `txid` with different `vout` values is valid:

```ts
tx.addInput({ txid: "abc123…", vout: 0, value: 15000 }, wallet.getPairKey(0))
tx.addInput({ txid: "abc123…", vout: 1, value: 20000 }, wallet.getPairKey(1))  // same txid, different vout — OK
```

---

## Fee management

### Manual fee (subtract from output amount yourself)

```ts
const tx = new Transaction(pairKey)
tx.addInput({ txid: "…", vout: 0, value: 50000 })
tx.addOutput({ address: "tb1q…", amount: 49800 })  // 200 sats fee = 50000 - 49800
tx.sign()
```

### Automatic fee (resolveFee)

Pass `fee` (sat/vbyte) and `whoPayTheFee` when creating the transaction.
Call `resolveFee()` to deduct the calculated fee, then `sign()` to rebuild.

```ts
const tx = new Transaction(pairKey, {
    fee: 2,            // 2 sat/vbyte
    whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf"
})

tx.addInput({ txid: "…", vout: 0, value: 50000 })
tx.addOutput({ address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf", amount: 25000 })
tx.addOutput({ address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj", amount: 25000 })

tx.resolveFee()  // subtracts fee from the first output
tx.sign()        // rebuild with fee-adjusted amounts

console.log(tx.getFeeSats())  // fee in satoshis
console.log(tx.getRawHex())
```

**Fee strategies for `whoPayTheFee`:**

| Value | Behaviour |
|-------|-----------|
| `"address"` | Full fee deducted from the output matching that address |
| `"everyone"` | Fee split evenly among all outputs |
| *(single output)* | Fee deducted from the only output regardless of `whoPayTheFee` |

> `resolveFee()` is **idempotent** — calling it more than once has no additional effect.

---

## Inspecting a signed transaction

```ts
tx.sign()

// Raw bytes
const rawHex:   string     = tx.getRawHex()
const rawBytes: Uint8Array = tx.getRawBytes()

// Transaction ID (double SHA-256 of non-witness serialization — BIP 141 compliant)
const txid: string = tx.getTxid()

// Size metrics
const weight: number = tx.weight()   // BIP 141 weight units
const vbytes: number = tx.vBytes()   // virtual bytes — ceil(weight / 4)

// Fee
const feeSats: number = tx.getFeeSats()  // satoshis
```

---

## Watch-only wallets

A watch-only wallet derived from an xpub can generate addresses for monitoring
incoming transactions, but cannot sign.

```ts
const { wallet } = HDWallet.import("xpub6CUGRUonZSQ4…")

console.log(wallet.isWatchOnly)             // true
const addrs = wallet.listReceiveAddresses(10)  // generate monitoring addresses
wallet.getPairKey(0)                        // throws — no private key
```

---

## Replace-By-Fee (RBF)

By default, every input has `sequence = 0xfffffffd` which signals RBF (BIP 125).
This allows you to replace a stuck low-fee transaction with a higher-fee version.

To disable RBF for a specific input, set its sequence to `"ffffffff"`:

```ts
tx.addInput({
    txid: "…",
    vout: 0,
    value: 10000,
    sequence: "ffffffff"   // RBF disabled for this input
})
```

---

## Key types reference

### ECPairKey

```ts
const key = new ECPairKey()                          // random mainnet
const key = new ECPairKey({ network: "testnet" })
const key = ECPairKey.fromWif("cNk5…")
const key = ECPairKey.fromHex("0c28fca386c7a227…", "mainnet")

key.getAddress("p2wpkh")  // bech32 (bc1… / tb1…)
key.getAddress("p2pkh")   // legacy (1… / m… / n…)
key.getPublicKey()        // Uint8Array — compressed (33 bytes)
key.getPrivateKey()       // Uint8Array — 32 bytes
key.getPublicKeyHex()     // hex string
key.getPrivateKeyHex()    // hex string
key.getWif()              // Wallet Import Format (compressed, standard)
key.signDER(hash)         // DER-encoded ECDSA signature
key.verifySignature(hash, sig)
```

### TXOptions

```ts
interface TXOptions {
    version?: number       // default: 2
    locktime?: number      // default: 0
    fee?: number           // sat/vbyte
    whoPayTheFee?: string  // address or "everyone"
}
```

---

## Important notes

- **UTXO discovery** — the library does not scan the blockchain. You must provide the UTXOs externally (via a block explorer API, Electrum, or a full node).
- **Address tracking** — you are responsible for tracking which address indexes you have used and whether they have received funds.
- **Broadcasting** — sign the transaction with `getRawHex()` and broadcast via any Bitcoin node or third-party API (e.g., Blockstream Esplora, Mempool.space).
- **Supported address types** — P2PKH (legacy) and P2WPKH (native SegWit). P2SH and P2WSH are not supported for spending.
- **Network safety** — always test on testnet before mainnet. Use `network: "testnet"` in all options.
