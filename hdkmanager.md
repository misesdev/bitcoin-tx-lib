# HDKManager — HD Key Manager

`HDKManager` manages BIP32 hierarchical deterministic key derivation.
It supports both BIP44 (legacy P2PKH) and BIP84 (native SegWit P2WPKH) derivation paths
and can operate in full (private key) or watch-only (public key only) mode.

## Import

```ts
import { HDKManager } from 'bitcoin-tx-lib'
```

---

## Creating an instance

### From a BIP39 mnemonic

```ts
const hdk = HDKManager.fromMnemonic("pistol lesson rigid season script crouch clog spin lottery canal deal leaf")

// With BIP39 passphrase and BIP44 (legacy P2PKH) purpose
const hdk = HDKManager.fromMnemonic("your mnemonic", "my passphrase", { purpose: 44 })
```

The default purpose is **84** (BIP84, native SegWit).

| `purpose` | Standard | Address type | Path |
|-----------|----------|-------------|------|
| `84` (default) | BIP84 | P2WPKH (`bc1…`) | `m/84'/0'/0'/change/index` |
| `44` | BIP44 | P2PKH (`1…`) | `m/44'/0'/0'/change/index` |

### From a master seed (raw bytes)

```ts
const hdk = HDKManager.fromMasterSeed(seedBytes)

// With custom purpose
const hdk = HDKManager.fromMasterSeed(seedBytes, { purpose: 44 })
```

### From an extended private key (xprv / tprv)

```ts
const hdk = HDKManager.fromXPriv("xprv9s21ZrQH143K...")

// With derivation options
const hdk = HDKManager.fromXPriv("xprv9s21ZrQH143K...", { purpose: 44, account: 1 })
```

### From an extended public key — watch-only (xpub / tpub)

```ts
const hdk = HDKManager.fromXPub("xpub6CUGRUonZSQ4...")
```

A watch-only instance can derive public keys and addresses but **cannot sign transactions**.
It uses a simplified path `m/change/index` relative to the xpub root.

---

## Derivation path

When initialized with a private key the full hardened path is used:

```
m / purpose' / coinType' / account' / change / index
```

Example (BIP84, mainnet, account 0, external chain, index 5):
```
m/84'/0'/0'/0/5
```

Use `getDerivationPath()` to inspect the exact path:

```ts
const path = hdk.getDerivationPath(5)
// → "m/84'/0'/0'/0/5"

// Custom account / change
const path = hdk.getDerivationPath(5, { account: 1, change: 1 })
// → "m/84'/0'/1'/1/5"
```

For **watch-only** instances (xpub) the path is relative to the xpub root:
```
m/change/index   →   m/0/5
```

---

## Deriving keys

### Single private key

```ts
const privateKey: Uint8Array = hdk.derivatePrivateKey(0)
```

Throws if the instance is watch-only.

### Single public key

```ts
const publicKey: Uint8Array = hdk.derivatePublicKey(0)
```

Works in both full and watch-only mode.

### ECPairKey (private + public)

```ts
const pair = hdk.derivatePairKey(0, { network: "mainnet" })
const address = pair.getAddress("p2wpkh")
const wif = pair.getWif()
```

Throws if the instance is watch-only.

---

## Deriving multiple keys

```ts
// Multiple private keys (indexes 0 … quantity-1)
const privateKeys: Uint8Array[] = hdk.deriveMultiplePrivateKeys(5)

// Multiple public keys
const publicKeys: Uint8Array[] = hdk.deriveMultiplePublicKeys(5)

// Multiple ECPairKeys
const pairs = hdk.derivateMultiplePairKeys(5, { network: "testnet" })
pairs.forEach(pair => console.log(pair.getAddress("p2wpkh")))
```

All methods accept an optional `PathOptions` as last argument:

```ts
// Derive 5 change-chain keys from account 2
const pairs = hdk.derivateMultiplePairKeys(5, { network: "mainnet" }, { account: 2, change: 1 })
```

---

## PathOptions

All derivation methods accept an optional `PathOptions` object to override the
account or change level for a single call without changing the manager's defaults.

```ts
interface PathOptions {
    account?: number   // default: manager.account (0)
    change?: number    // 0 = external/receive, 1 = internal/change
}
```

---

## Master key access

```ts
// Check mode
const isFull = hdk.hasPrivateKey()   // false when imported from xpub

// Raw key bytes (root key, not derived)
const masterPriv: Uint8Array = hdk.getMasterPrivateKey()  // throws if watch-only
const masterPub:  Uint8Array = hdk.getMasterPublicKey()

// Extended keys (base58-encoded)
const xprv: string = hdk.getXPriv()  // throws if watch-only
const xpub: string = hdk.getXPub()
```

---

## Public properties

| Property | Type | Description |
|----------|------|-------------|
| `purpose` | `44 \| 84` | BIP purpose (derivation path level 1) |
| `coinType` | `number` | BIP44 coin type — `0` = Bitcoin mainnet |
| `account` | `number` | Default account index |
| `change` | `number` | Default change level — `0` receive, `1` change |

---

## Error handling

| Condition | Error thrown |
|-----------|-------------|
| Index < 0 or > 2 147 483 647 | `"Invalid derivation index"` |
| Private key access on watch-only | `"Missing private key"` |
| `fromXPriv` with invalid key | `"Provided xpriv is invalid or missing private key"` |
| `fromXPub` with private key present | `"xpub should not contain a private key"` |

---

## Complete example

```ts
import { HDKManager } from 'bitcoin-tx-lib'

const mnemonic = "pistol lesson rigid season script crouch clog spin lottery canal deal leaf"

// BIP84 wallet (native SegWit)
const hdk = HDKManager.fromMnemonic(mnemonic)

// First 3 receive addresses
for (let i = 0; i < 3; i++) {
    const pair = hdk.derivatePairKey(i, { network: "mainnet" })
    console.log(`m/84'/0'/0'/0/${i}:`, pair.getAddress("p2wpkh"))
}

// First change address on account 1
const changePair = hdk.derivatePairKey(0, { network: "mainnet" }, { account: 1, change: 1 })
console.log("change:", changePair.getAddress("p2wpkh"))

// Export xpub for watch-only use
const xpub = hdk.getXPub()

// Watch-only wallet from xpub
const watchOnly = HDKManager.fromXPub(xpub)
const pubkey = watchOnly.derivatePublicKey(0)  // works
// watchOnly.derivatePrivateKey(0)             // throws
```
