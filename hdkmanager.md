# HDKManager — HD Key Manager

`HDKManager` manages BIP32 hierarchical deterministic key derivation.
It supports BIP44 (legacy P2PKH) and BIP84 (native SegWit P2WPKH) derivation paths
for both mainnet and testnet, and can operate in full (private key) or watch-only (public key only) mode.

## Import

```ts
import { HDKManager } from 'bitcoin-tx-lib'
```

---

## Creating an instance

### From a BIP39 mnemonic

```ts
// BIP84 mainnet (default)
const hdk = HDKManager.fromMnemonic("pistol lesson rigid season script crouch clog spin lottery canal deal leaf")

// BIP44 testnet
const hdk = HDKManager.fromMnemonic("your mnemonic", "passphrase", { purpose: 44, network: "testnet" })
```

The default purpose is **84** (BIP84) and the default network is **mainnet**.

| `purpose` | `network` | Address type | Extended key prefix | Derivation path |
|-----------|-----------|-------------|---------------------|-----------------|
| `84` (default) | `mainnet` (default) | P2WPKH (`bc1…`) | `zprv` / `zpub` | `m/84'/0'/0'/change/index` |
| `84` | `testnet` | P2WPKH (`tb1…`) | `vprv` / `vpub` | `m/84'/1'/0'/change/index` |
| `44` | `mainnet` | P2PKH (`1…`) | `xprv` / `xpub` | `m/44'/0'/0'/change/index` |
| `44` | `testnet` | P2PKH (`m…`/`n…`) | `tprv` / `tpub` | `m/44'/1'/0'/change/index` |

> **Note on coinType**: `coinType` defaults to `0` regardless of network.
> Per BIP44, `coinType: 1` is the standard for testnet. Pass `{ coinType: 1 }` explicitly if needed.

### From a master seed (raw bytes)

```ts
const hdk = HDKManager.fromMasterSeed(seedBytes)
const hdk = HDKManager.fromMasterSeed(seedBytes, { purpose: 84, network: "testnet" })
```

### From an extended private key

Accepts **xprv** (BIP44 mainnet), **tprv** (BIP44 testnet), **zprv** (BIP84 mainnet), **vprv** (BIP84 testnet).
Purpose and network are **automatically inferred** from the key prefix.

```ts
const hdk = HDKManager.fromXPriv("xprv9s21ZrQH143K...")   // BIP44 mainnet
const hdk = HDKManager.fromXPriv("tprv8ZgxMBicQKsPd...")  // BIP44 testnet
const hdk = HDKManager.fromXPriv("zprvAWgYBBk7JR8G...")   // BIP84 mainnet
const hdk = HDKManager.fromXPriv("vprv9DMUxX4ShgxMK...")  // BIP84 testnet

// Override inferred values
const hdk = HDKManager.fromXPriv("xprv9s21ZrQH143K...", { account: 1 })
```

### From an extended public key — watch-only

Accepts **xpub** (BIP44 mainnet), **tpub** (BIP44 testnet), **zpub** (BIP84 mainnet), **vpub** (BIP84 testnet).
Purpose and network are **automatically inferred** from the key prefix.

```ts
const hdk = HDKManager.fromXPub("xpub661MyMwAqRbcE...")  // BIP44 mainnet, watch-only
const hdk = HDKManager.fromXPub("tpubD6NzVbkrYhZ4W...")  // BIP44 testnet, watch-only
const hdk = HDKManager.fromXPub("zpub6jftahH18ngZw...")  // BIP84 mainnet, watch-only
const hdk = HDKManager.fromXPub("vpub5SLqN2bLY4WeY...")  // BIP84 testnet, watch-only
```

A watch-only instance can derive public keys and addresses but **cannot sign transactions**.
It uses a simplified path `m/change/index` relative to the xpub root.

---

## Derivation path

When initialized with a private key, the full hardened BIP44/84 path is used:

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

const path = hdk.getDerivationPath(5, { account: 1, change: 1 })
// → "m/84'/0'/1'/1/5"
```

For **watch-only** instances (imported from xpub), the path is relative to the xpub root:
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
// Uses HDKManager.network by default
const pair = hdk.derivatePairKey(0)

// Explicit network override
const pair = hdk.derivatePairKey(0, { network: "testnet" })

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

// Multiple ECPairKeys — network inherited from HDKManager.network
const pairs = hdk.derivateMultiplePairKeys(5)
pairs.forEach(pair => console.log(pair.getAddress("p2wpkh")))

// Explicit network override
const pairs = hdk.derivateMultiplePairKeys(5, { network: "testnet" })
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

// Extended keys — prefix reflects purpose + network
// mainnet BIP44 → xprv/xpub, testnet BIP44 → tprv/tpub
// mainnet BIP84 → zprv/zpub, testnet BIP84 → vprv/vpub
const xprv: string = hdk.getXPriv()  // throws if watch-only
const xpub: string = hdk.getXPub()
```

---

## Public properties

| Property | Type | Description |
|----------|------|-------------|
| `purpose` | `44 \| 84` | BIP purpose (derivation path level 1) |
| `coinType` | `number` | BIP44 coin type — `0` = Bitcoin mainnet (default) |
| `account` | `number` | Default account index |
| `change` | `number` | Default change level — `0` receive, `1` change |
| `network` | `"mainnet" \| "testnet"` | Network associated with this manager |

---

## Error handling

| Condition | Error thrown |
|-----------|-------------|
| Index < 0 or > 2 147 483 647 | `"Invalid derivation index"` |
| Private key access on watch-only | `"Missing private key"` |
| `fromXPriv` with invalid key | `"Provided xpriv is invalid or missing private key"` |
| `fromXPub` with private key present | `"xpub should not contain a private key"` |
| Unrecognized extended key prefix | `"Unrecognized extended key prefix: \"<prefix>\". Supported: xprv/xpub, tprv/tpub, zprv/zpub, vprv/vpub"` |

---

## Complete example

```ts
import { HDKManager } from 'bitcoin-tx-lib'

const mnemonic = "pistol lesson rigid season script crouch clog spin lottery canal deal leaf"

// ── BIP84 mainnet wallet ──────────────────────────────────────────────────────
const hdk = HDKManager.fromMnemonic(mnemonic, undefined, { purpose: 84, network: "mainnet" })

for (let i = 0; i < 3; i++) {
    const pair = hdk.derivatePairKey(i)
    console.log(`m/84'/0'/0'/0/${i}:`, pair.getAddress("p2wpkh"))
    // → bc1q...
}

console.log(hdk.getXPriv())  // → zprvA...
console.log(hdk.getXPub())   // → zpub6...

// ── BIP84 testnet wallet ──────────────────────────────────────────────────────
const hdkTest = HDKManager.fromMnemonic(mnemonic, undefined, { purpose: 84, network: "testnet" })

for (let i = 0; i < 3; i++) {
    const pair = hdkTest.derivatePairKey(i)
    console.log(`m/84'/0'/0'/0/${i}:`, pair.getAddress("p2wpkh"))
    // → tb1q...
}

console.log(hdkTest.getXPriv())  // → vprvA...
console.log(hdkTest.getXPub())   // → vpub5...

// ── Import from extended key (auto-detects purpose + network) ─────────────────
const fromTprv = HDKManager.fromXPriv("tprv8ZgxMBicQKsPd...")
console.log(fromTprv.purpose)    // 44
console.log(fromTprv.network)    // "testnet"

const fromZpub = HDKManager.fromXPub("zpub6jftahH18ngZw...")
console.log(fromZpub.purpose)    // 84
console.log(fromZpub.network)    // "mainnet"
console.log(fromZpub.hasPrivateKey())  // false — watch-only

// ── Watch-only wallet from zpub ───────────────────────────────────────────────
const pubkey = fromZpub.derivatePublicKey(0)  // works
// fromZpub.derivatePrivateKey(0)             // throws: "Missing private key"
```
