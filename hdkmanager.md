
## HDKManager – Hierarchical Deterministic Key Manager

The `HDKManager` class provides a simple and robust interface for managing hierarchical deterministic wallets (HD wallets) following the BIP44 standard. It allows you to derive Bitcoin key pairs from a master seed or mnemonic phrase with support for custom derivation paths.


### Importing

```ts
import { HDKManager } from 'bitcoin-tx-lib';
```

---

### Creating an Instance

#### From a BIP39 mnemonic phrase

```ts
const hdk = HDKManager.fromMnemonic("pistol lesson rigid season script crouch clog spin lottery canal deal leaf");
```

Optionally, you can provide a password for additional security:

```ts
const hdk = HDKManager.fromMnemonic("your mnemonic", "your optional password");
```

#### From a hex-encoded master seed

```ts
const hdk = HDKManager.fromMasterSeed("hexadecimal_seed_string");
```

---

### Deriving a Private Key

Derive a private key using an index:

```ts
const privateKey = hdk.derivatePrivateKey(0); // returns Uint8Array
```

---

### Deriving Multiple Private Keys

```ts
const keys = hdk.deriveMultiplePrivateKeys(3); // returns array of Uint8Array
```

---

### Deriving a Bitcoin Key Pair (ECPairKey)

To derive a Bitcoin key pair from a specific index:

```ts
const pairKey = hdk.derivatePairKey(0, "mainnet"); // or "testnet"
const address = pairKey.getAddress("p2wpkh");
```

---

### Deriving Multiple Bitcoin Key Pairs

```ts
const pairs = hdk.derivateMultiplePairKeys(5, "testnet");
pairs.forEach(pair => {
    console.log(pair.getAddress("p2pkh"));
});
```

---

### Customizing the Derivation Path

By default, the derivation path follows BIP44:
`m/44'/0'/0'/0/index`

You can customize this during instantiation:

```ts
const hdk = new HDKManager({
  masterSeed,
  purpose: 49,       // e.g., BIP49 for P2SH
  coinType: 1,       // e.g., testnet
  account: 2,
  change: 1
});
```

To view the exact path for a given index:

```ts
const path = hdk.getDerivationPath(0);
// m/49'/1'/2'/1/0
```

---

### Error Handling

* An error is thrown if:

  * The derivation index is negative or too large.
  * The derived key is missing a private key (rare, but possible in some derivations).

Always validate or handle exceptions where needed.

---

### Summary

The `HDKManager` is a lightweight and flexible solution to generate BIP44-compatible HD wallets in any TypeScript project, including web and mobile environments. Use it to securely manage deterministic Bitcoin key generation with full control over the derivation path structure.

---

