# bitcoin-tx-lib

A TypeScript library for building and signing Bitcoin transactions (P2PKH and P2WPKH),
focused on compatibility across any TypeScript environment, with minimal dependencies
and built in pure TypeScript. Fully compatible with React, React Native, and any
TypeScript project, with no reliance on native modules.

## Index

- [Manage Pair Key](#manage-pair-key)
  - [How to create and import key pairs from different sources](#how-to-create-and-import-key-pairs-from-different-sources)
  - [How to extract key pair information](#how-to-extract-key-pair-information)
- [How to set up a transaction](#how-to-set-up-a-transaction)
  - [Transaction (single key)](#transaction-single-key)
  - [HDTransaction (per-input key)](#hdtransaction-per-input-key)
  - [Network fee](#network-fee)
- [How to use Hierarchical Deterministic Keys](hdkmanager.md)
- [How to use HD Wallet functions](hdwallet.md)
- [Building an HD Bitcoin Wallet with `bitcoin-tx-lib`](wallet.md)

## Install

```bash
npm install bitcoin-tx-lib
```

## Manage Pair Key

### How to create and import key pairs from different sources

```typescript
import { ECPairKey } from 'bitcoin-tx-lib'

// Generate a random key pair (mainnet)
const pairKey = new ECPairKey()

// Generate a random key pair (testnet)
const pairKey = new ECPairKey({ network: "testnet" })

// Import from raw private key (hex)
const pairKey = ECPairKey.fromHex(
    "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d",
    "testnet"
)

// Import from WIF (Wallet Import Format)
// Both compressed (52-char) and uncompressed (51-char) WIFs are supported
const pairKey = ECPairKey.fromWif("cNk5Vf4VwDPSUFqn4JzwGJHpNMm5mWnHSTRFDWJZm7jdHrr5Uef")
```

### How to extract key pair information

```typescript
const pairKey = ECPairKey.fromWif("cNk5Vf4VwDPSUFqn4JzwGJHpNMm5mWnHSTRFDWJZm7jdHrr5Uef")

// Get private key as Uint8Array (use getPrivateKeyHex() for hex string)
const privateKey: Uint8Array = pairKey.getPrivateKey()

// Get compressed public key as Uint8Array (use getPublicKeyHex() for hex string)
const publicKey: Uint8Array = pairKey.getPublicKey()

// Get address (P2WPKH native SegWit by default)
const addressSegwit = pairKey.getAddress()          // "p2wpkh" is the default
const addressLegacy = pairKey.getAddress("p2pkh")

// Export WIF (compressed format, compatible with standard wallets)
const wif = pairKey.getWif()
```

## How to set up a transaction

Supported script types: **P2PKH** (legacy) and **P2WPKH** (native SegWit).
The library automatically detects the type from the `scriptPubKey` of each input.

### Transaction (single key)

Use `Transaction` when all inputs are controlled by the same key pair.

```typescript
import { ECPairKey, Transaction } from 'bitcoin-tx-lib'

const pairKey = ECPairKey.fromWif("cNk5Vf4VwDPSUFqn4JzwGJHpNMm5mWnHSTRFDWJZm7jdHrr5Uef")

const tx = new Transaction(pairKey)

tx.addInput({
    txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
    vout: 1,
    value: 15197,
    // scriptPubKey is optional — auto-derived from the key pair if omitted
    scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9"
})

tx.addOutput({
    address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
    amount: 14197  // value minus fee
})

tx.sign()

const rawHex = tx.getRawHex()  // hex-encoded signed transaction
const txid   = tx.getTxid()    // correct txid (non-witness hash for SegWit, BIP 141)
```

> **Note:** Multiple UTXOs from the same parent transaction (same txid, different vout)
> are fully supported. Only spending the exact same UTXO (txid + vout) twice is rejected.

### HDTransaction (per-input key)

Use `HDTransaction` when inputs are signed by different HD-derived key pairs.

```typescript
import { HDTransaction, HDWallet } from 'bitcoin-tx-lib'

const { wallet } = HDWallet.create()  // or HDWallet.import(mnemonic)

const tx = new HDTransaction()

tx.addInput({
    txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
    vout: 0,
    value: 10000
}, wallet.getPairKey(0))  // key for this specific input

tx.addInput({
    txid: "157da15b3cdb2561602bd889d578227aa089915e3945c6d26569d27aecb9a4f7",
    vout: 1,
    value: 20000
}, wallet.getPairKey(1))  // different key for this input

tx.addOutput({
    address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
    amount: 29500
})

tx.sign()

const rawHex = tx.getRawHex()
const txid   = tx.getTxid()
```

### Network fee

Pass `whoPayTheFee` and `fee` (sat/vbyte) when creating the transaction.
Call `resolveFee()` to deduct the fee from the designated output(s),
then call `sign()` to rebuild the transaction with the updated amounts.

**`resolveFee()` is idempotent** — calling it multiple times has no additional effect.

```typescript
const tx = new Transaction(pairKey, {
    whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
    fee: 2,  // 2 sat/vbyte
})

tx.addInput({ txid: "...", vout: 1, value: 30000 })
tx.addOutput({ address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf", amount: 15000 })
tx.addOutput({ address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj", amount: 15000 })

tx.resolveFee()  // deducts fee from the first address only
tx.sign()        // rebuild with fee-adjusted amounts

const raw = tx.getRawHex()
```

Set `whoPayTheFee` to `"everyone"` to split the fee evenly among all outputs:

```typescript
const tx = new Transaction(pairKey, {
    whoPayTheFee: "everyone",
    fee: 2,
})
// ...
tx.resolveFee()
tx.sign()
```

Use `getFeeSats()` to inspect the fee without deducting it:

```typescript
tx.sign()
const fee = tx.getFeeSats()  // total fee in satoshis
```

#### Transaction size helpers

```typescript
tx.sign()

const weight = tx.weight()   // BIP 141 weight units
const vbytes = tx.vBytes()   // virtual bytes (ceil(weight / 4))
```

> **Replace-By-Fee (RBF):** By default every input uses `sequence = 0xfffffffd`,
> enabling RBF (BIP 125). To disable RBF for an input, set `sequence: "ffffffff"`.

## Changelog

### 0.5.0

- **Fix:** `HDTransaction.sign()` now correctly uses the stripped (non-witness)
  serialization for txid computation, satisfying BIP 141. Previously,
  SegWit txids were computed over the witness-inclusive bytes.
- **Fix:** `HDKManager.fromMnemonic()` and `fromMasterSeed()` now forward
  `purpose`, `coinType`, `account`, and `change` options to the constructor.
  Previously, `purpose: 44` was silently ignored, causing BIP84 paths to be
  used instead of BIP44.
- **Fix:** `ECPairKey.getWif()` now appends the `0x01` compressed-key flag byte
  before the checksum, producing standard compressed WIF (52-char). Previously,
  exported WIFs were interpreted by external wallets as uncompressed keys,
  deriving incorrect addresses.
- **Fix:** `generateScriptSig()` now uses each input's own `sequence` value in
  the signing preimage. Previously, all inputs in the preimage inherited the
  sequence of the input being signed, producing invalid signatures for
  multi-input legacy transactions.
- **Fix:** `resolveFee()` is now idempotent (calling twice no longer double-deducts
  the fee) and invalidates the cached raw transaction after adjusting output amounts,
  so `getRawHex()` always returns the fee-adjusted transaction.
- **Fix:** `validateInput()` now checks `txid + vout` for duplicates instead of
  `txid` alone, allowing multiple UTXOs from the same parent transaction and
  correctly rejecting only double-spends of the exact same output.
- **Fix:** `HDTransactionBase.build()` now encodes the legacy scriptSig length
  as a proper Bitcoin varint instead of a fixed 1-byte value, fixing malformed
  transactions when scriptSig exceeds 252 bytes.
- **Fix:** `scriptPubkeyToScriptCode()` now correctly identifies P2WSH scripts
  (`OP_0 <32-byte-hash>`, prefix `0x00 0x20`) enabling witness generation for
  P2WSH inputs. The previous check used opcode `0x79` (OP_SWAP) which never
  matched any real script.
- **Fix:** `ECPairKey.signDER()` no longer loops until exactly 70 bytes. All
  valid DER signatures (70–72 bytes) are now accepted, eliminating an unnecessary
  restriction and potential long loops for certain key/message combinations.
- **Fix:** `hexToBytes()` loop bound corrected from `<=` to `<`, eliminating a
  silent out-of-bounds write on typed arrays.
- **Fix:** `OP_PUSHBYTES_20` and `OP_PUSHBYTES_32` corrected to `0x14` (20) and
  `0x20` (32) respectively.
- **Improvement:** `weight()` now derives witness size from the cached
  serialized transaction (txraw vs txidraw diff) instead of re-signing all
  inputs on each call, making it consistent and eliminating redundant signing.
- **Test:** Added idempotency tests for `resolveFee()`.
- **Test:** Added test covering multiple inputs from the same parent transaction.
