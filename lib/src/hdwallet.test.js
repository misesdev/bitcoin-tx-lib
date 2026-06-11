"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hdwallet_1 = require("./hdwallet");
const ecpairkey_1 = require("./ecpairkey");
const utils_1 = require("./utils");
const mnemonic_1 = require("./utils/mnemonic");
const MNEMONIC_A = "visit tube task scout glass push sunny number top truck anchor hood";
const XPRIV = "xprv9s21ZrQH143K2LQXAHgER7W7Sije5ovKHnqhurYDXSBYYLYKxxApnNo9i9mFrUFMxvKJAYhbZbB2USWZAYtgqZ8vaB8QqareQaSU8M1B3UC";
const XPUB = "xpub661MyMwAqRbcEpUzGKDEnFSqzka8VGeAf1mJiEwq5miXR8sUWVV5LB7dZUACgNFBxcuESbK7L3UtR8N3dFVdydEEztkuGVvjKz8MBVd5s8K";
const NETWORK = "testnet";
// Extended key fixtures derived from MNEMONIC_A for import round-trip tests
const TPRV_A = "tprv8ZgxMBicQKsPdNPeaAPd5mZauWwXFposd8RMhrcVgCD3ymv8v2oKuuyE9fxDJ1UYdnxZbeoLGY3mtkFHigtTUs6cBvSzbfFn4BCuhPx7cBY";
const TPUB_A = "tpubD6NzVbkrYhZ4WqRSTp4DVBDhUYTTR9znCS28zNeo6U1SpGAuYRcv6Qb6Koy34hd98neFw5BidevjBXQ9RUVyTpjesiRuiRoXnSg171DHTZc";
const ZPUB_A = "zpub6jftahH18ngZwdcpgLeNhS5LVMehK1UiV2UHCcPRWa1KBB8eyX6xC6EY8BoRY1ykAALxpSry1sonFv8fU1UmAreZYo5TCinGjwCt8FC6Z4u";
const VPUB_A = "vpub5SLqN2bLY4WeYSrMLuVss5hKoV4uYXWipaPQ52oszYVnxmsjxtShhqbz3My5YPN4XbsjpYUjBEPaimgQbDphyuvA5SHks5WKf2xJZviYibL";
describe("HDWallet", () => {
    describe("create()", () => {
        test("generates 12-word mnemonic and a full wallet", () => {
            const { mnemonic, wallet } = hdwallet_1.HDWallet.create(undefined, { network: NETWORK, purpose: 44 });
            expect(mnemonic === null || mnemonic === void 0 ? void 0 : mnemonic.split(" ").length).toBe(12);
            expect(wallet).toBeInstanceOf(hdwallet_1.HDWallet);
            expect(wallet.isWatchOnly).toBe(false);
            expect(wallet.network).toBe(NETWORK);
        });
        test("mnemonic is a valid BIP39 phrase", () => {
            const { mnemonic } = hdwallet_1.HDWallet.create();
            expect(mnemonic_1.MnemonicUtils.validateMnemonic(mnemonic)).toBe(true);
        });
    });
    describe("import()", () => {
        test("imports from mnemonic and preserves it in return value", () => {
            const { mnemonic, wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 });
            expect(mnemonic).toBe(MNEMONIC_A);
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("imports from xpriv as full wallet", () => {
            const { wallet } = hdwallet_1.HDWallet.import(XPRIV, "", { network: NETWORK });
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("imports from xpub as watch-only", () => {
            const { wallet } = hdwallet_1.HDWallet.import(XPUB, "", { network: NETWORK });
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("trims whitespace from mnemonic input", () => {
            const padded = "  " + MNEMONIC_A + "  ";
            const { wallet } = hdwallet_1.HDWallet.import(padded);
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("throws on invalid mnemonic (wrong word)", () => {
            expect(() => hdwallet_1.HDWallet.import("visit tube task scout glass push rural number top truck anchor hood")).toThrow("Invalid seed phrase (mnemonic)");
        });
        test("throws on unsupported format", () => {
            expect(() => hdwallet_1.HDWallet.import("not_a_valid_key_or_mnemonic")).toThrow("Unsupported or invalid HD wallet data format");
        });
    });
    // ── PURPOSE PROPAGATION — anti-regression for bug fix #2 ──────────────────
    describe("purpose propagation — address type anti-regression", () => {
        test("purpose:44 + mainnet → p2pkh addresses starting with 1", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 44 });
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^1/));
        });
        test("purpose:44 + testnet → p2pkh addresses starting with m or n", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 44 });
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^[mn]/));
        });
        test("purpose:84 + mainnet → p2wpkh addresses starting with bc1", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^bc1/));
        });
        test("purpose:84 + testnet → p2wpkh addresses starting with tb1", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^tb1/));
        });
        test("purpose:44 and purpose:84 produce distinct addresses from same mnemonic", () => {
            const { wallet: w44 } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 44 });
            const { wallet: w84 } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            expect(w44.getAddress(0)).not.toBe(w84.getAddress(0));
        });
    });
    // ── DETERMINISTIC DERIVATION ───────────────────────────────────────────────
    describe("deterministic derivation", () => {
        test("same mnemonic always produces same address at index 0", () => {
            const { wallet: w1 } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const { wallet: w2 } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            expect(w1.getAddress(0)).toBe(w2.getAddress(0));
        });
        test("different indexes produce different addresses", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            expect(wallet.getAddress(0)).not.toBe(wallet.getAddress(1));
        });
        test("different mnemonics produce different addresses", () => {
            const { mnemonic: mnemonicX } = hdwallet_1.HDWallet.create();
            const { wallet: wA } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const { wallet: wB } = hdwallet_1.HDWallet.import(mnemonicX, "", { network: "mainnet", purpose: 84 });
            expect(wA.getAddress(0)).not.toBe(wB.getAddress(0));
        });
    });
    // ── RECEIVE vs CHANGE ADDRESSES ───────────────────────────────────────────
    describe("receive vs change address separation", () => {
        let wallet;
        beforeAll(() => { ({ wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })); });
        test("listReceiveAddresses returns 'quantity' addresses", () => {
            expect(wallet.listReceiveAddresses(5).length).toBe(5);
        });
        test("listChangeAddresses returns 'quantity' addresses", () => {
            expect(wallet.listChangeAddresses(5).length).toBe(5);
        });
        test("receive and change addresses do not overlap", () => {
            const receive = wallet.listReceiveAddresses(5);
            const change = wallet.listChangeAddresses(5);
            receive.forEach(addr => expect(change).not.toContain(addr));
        });
        test("same index on receive vs change chain produces different address", () => {
            const receive = wallet.listReceiveAddresses(1);
            const change = wallet.listChangeAddresses(1);
            expect(receive[0]).not.toBe(change[0]);
        });
        test("listAddresses with change:0 matches listReceiveAddresses", () => {
            const fromListAddresses = wallet.listAddresses(3, { change: 0 });
            const fromReceive = wallet.listReceiveAddresses(3);
            expect(fromListAddresses).toEqual(fromReceive);
        });
        test("listAddresses with change:1 matches listChangeAddresses", () => {
            const fromListAddresses = wallet.listAddresses(3, { change: 1 });
            const fromChange = wallet.listChangeAddresses(3);
            expect(fromListAddresses).toEqual(fromChange);
        });
    });
    // ── WATCH-ONLY WALLET ──────────────────────────────────────────────────────
    describe("watch-only wallet", () => {
        const { wallet } = hdwallet_1.HDWallet.import(XPUB, "", { network: NETWORK, purpose: 44 });
        test("isWatchOnly is true", () => {
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("can derive addresses", () => {
            const addresses = wallet.listAddresses(2);
            expect(addresses.length).toBe(2);
            addresses.forEach(addr => expect(typeof addr).toBe("string"));
        });
        test("can derive public key at index", () => {
            const pubkey = wallet.getPublicKey(0);
            expect(pubkey).toBeInstanceOf(Uint8Array);
            expect(pubkey.length).toBe(33);
        });
        test("can get master public key", () => {
            const pub = wallet.getMasterPublicKey();
            expect(pub).toBeInstanceOf(Uint8Array);
            expect(pub.length).toBe(33);
        });
        test("getPublicKey and getXPub return data without throwing", () => {
            expect(() => wallet.getPublicKey(0)).not.toThrow();
            expect(() => wallet.getXPub()).not.toThrow();
        });
        test("getPairKey throws for watch-only", () => {
            expect(() => wallet.getPairKey(0)).toThrow("The wallet only has the public key, it is read-only");
        });
        test("getPrivateKey throws for watch-only", () => {
            expect(() => wallet.getPrivateKey(0)).toThrow("The wallet only has the public key, it is read-only");
        });
        test("getXPriv throws for watch-only", () => {
            expect(() => wallet.getXPriv()).toThrow("The wallet only has the public key, it is read-only");
        });
        test("getMasterPrivateKey throws for watch-only", () => {
            expect(() => wallet.getMasterPrivateKey()).toThrow("The wallet only has the public key, it is read-only");
        });
        test("getWif throws for watch-only", () => {
            expect(() => wallet.getWif()).toThrow("The wallet only has the public key, it is read-only");
        });
    });
    // ── FULL WALLET ────────────────────────────────────────────────────────────
    describe("full access wallet", () => {
        const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 });
        test("listAddresses returns correct count", () => {
            expect(wallet.listAddresses(3).length).toBe(3);
        });
        test("listPairKeys returns correct count", () => {
            expect(wallet.listPairKeys(3).length).toBe(3);
        });
        test("getPrivateKey returns 32-byte Uint8Array", () => {
            const key = wallet.getPrivateKey(0);
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(32);
        });
        test("getPublicKey returns 33-byte Uint8Array", () => {
            const key = wallet.getPublicKey(0);
            expect(key).toBeInstanceOf(Uint8Array);
            expect(key.length).toBe(33);
        });
        test("getPairKey returns ECPairKey with valid address", () => {
            const pair = wallet.getPairKey(0);
            expect(pair).toBeInstanceOf(ecpairkey_1.ECPairKey);
            expect(typeof pair.getAddress()).toBe("string");
        });
        test("getXPriv returns non-empty string", () => {
            expect(typeof wallet.getXPriv()).toBe("string");
            expect(wallet.getXPriv().length).toBeGreaterThan(0);
        });
        test("getXPub returns non-empty string", () => {
            expect(typeof wallet.getXPub()).toBe("string");
            expect(wallet.getXPub().length).toBeGreaterThan(0);
        });
    });
    // ── getWif ────────────────────────────────────────────────────────────────
    describe("getWif", () => {
        test("mainnet wallet: getWif returns K/L-prefixed compressed WIF", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const wif = wallet.getWif();
            expect(typeof wif).toBe("string");
            expect(wif[0]).toMatch(/^[KL]/);
        });
        test("testnet wallet: getWif returns c-prefixed compressed WIF", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            expect(wallet.getWif()[0]).toBe("c");
        });
        test("getWif round-trips to master private key", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const wif = wallet.getWif();
            const recovered = ecpairkey_1.ECPairKey.fromWif(wif);
            const masterPriv = wallet.getMasterPrivateKey();
            expect((0, utils_1.bytesToHex)(recovered.getPrivateKey())).toBe((0, utils_1.bytesToHex)(masterPriv));
        });
    });
    // ── INVALID INDEX BOUNDS ──────────────────────────────────────────────────
    describe("invalid derivation indexes", () => {
        const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 });
        test("negative index throws", () => {
            expect(() => wallet.getPrivateKey(-1)).toThrow();
            expect(() => wallet.getAddress(-1)).toThrow();
            expect(() => wallet.getPublicKey(-1)).toThrow();
        });
        test("index > 2^31-1 throws", () => {
            const tooBig = 2147483648;
            expect(() => wallet.getPrivateKey(tooBig)).toThrow();
            expect(() => wallet.getPublicKey(tooBig)).toThrow();
        });
    });
    // ── NETWORK INFERENCE FROM EXTENDED KEY PREFIX ────────────────────────────
    describe("network inference from extended key prefix", () => {
        test("importing tprv without options infers testnet network", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPRV_A);
            expect(wallet.network).toBe("testnet");
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("importing tpub without options infers testnet network", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPUB_A);
            expect(wallet.network).toBe("testnet");
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("importing zpub without options infers mainnet network", () => {
            const { wallet } = hdwallet_1.HDWallet.import(ZPUB_A);
            expect(wallet.network).toBe("mainnet");
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("importing vpub without options infers testnet network", () => {
            const { wallet } = hdwallet_1.HDWallet.import(VPUB_A);
            expect(wallet.network).toBe("testnet");
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("explicit options.network overrides inferred network from key prefix", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPRV_A, undefined, { network: "mainnet" });
            expect(wallet.network).toBe("mainnet");
        });
    });
    // ── WATCH-ONLY WALLET — CORRECT NETWORK ON ADDRESSES ─────────────────────
    describe("watch-only wallet respects network for address generation", () => {
        test("xpub watch-only wallet generates mainnet p2pkh addresses (1...)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(XPUB, "", { network: "mainnet", purpose: 44 });
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^1/));
        });
        test("tpub watch-only wallet generates testnet p2pkh addresses (m/n...)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPUB_A);
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^[mn]/));
        });
        test("zpub watch-only wallet generates mainnet p2wpkh addresses (bc1...)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(ZPUB_A);
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^bc1/));
        });
        test("vpub watch-only wallet generates testnet p2wpkh addresses (tb1...)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(VPUB_A);
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^tb1/));
        });
        test("tpub watch-only listReceiveAddresses produces testnet addresses", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPUB_A);
            wallet.listReceiveAddresses(3).forEach(addr => expect(addr).toMatch(/^[mn]/));
        });
        test("tpub watch-only listChangeAddresses produces testnet addresses", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPUB_A);
            wallet.listChangeAddresses(3).forEach(addr => expect(addr).toMatch(/^[mn]/));
        });
        test("vpub watch-only getAddress produces testnet bech32 address", () => {
            const { wallet } = hdwallet_1.HDWallet.import(VPUB_A);
            expect(wallet.getAddress(0)).toMatch(/^tb1/);
        });
    });
    // ── IMPORT ALL SUPPORTED KEY FORMATS ─────────────────────────────────────
    describe("import() — all supported extended key formats", () => {
        test("imports tprv successfully (BIP44 testnet)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPRV_A);
            expect(wallet.isWatchOnly).toBe(false);
            expect(wallet.network).toBe("testnet");
        });
        test("imports tpub successfully (BIP44 testnet, watch-only)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(TPUB_A);
            expect(wallet.isWatchOnly).toBe(true);
            expect(wallet.network).toBe("testnet");
        });
        test("imports zpub successfully (BIP84 mainnet, watch-only)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(ZPUB_A);
            expect(wallet.isWatchOnly).toBe(true);
            expect(wallet.network).toBe("mainnet");
        });
        test("imports vpub successfully (BIP84 testnet, watch-only)", () => {
            const { wallet } = hdwallet_1.HDWallet.import(VPUB_A);
            expect(wallet.isWatchOnly).toBe(true);
            expect(wallet.network).toBe("testnet");
        });
        test("throws on unsupported extended key prefix", () => {
            expect(() => hdwallet_1.HDWallet.import("abcd1RandomData")).toThrow("Unsupported or invalid HD wallet data format");
        });
    });
    // ── EXTENDED KEY EXPORT MATCHES NETWORK ──────────────────────────────────
    describe("getXPriv/getXPub return correct prefix for network", () => {
        test("mnemonic mainnet BIP44 → getXPriv returns xprv", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 44 });
            expect(wallet.getXPriv()).toMatch(/^xprv/);
        });
        test("mnemonic testnet BIP44 → getXPriv returns tprv", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 44 });
            expect(wallet.getXPriv()).toMatch(/^tprv/);
        });
        test("mnemonic mainnet BIP84 → getXPriv returns zprv", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            expect(wallet.getXPriv()).toMatch(/^zprv/);
        });
        test("mnemonic testnet BIP84 → getXPriv returns vprv", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            expect(wallet.getXPriv()).toMatch(/^vprv/);
        });
        test("mnemonic testnet BIP44 → getXPub returns tpub", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 44 });
            expect(wallet.getXPub()).toMatch(/^tpub/);
        });
        test("mnemonic mainnet BIP84 → getXPub returns zpub", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            expect(wallet.getXPub()).toMatch(/^zpub/);
        });
        test("mnemonic testnet BIP84 → getXPub returns vpub", () => {
            const { wallet } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            expect(wallet.getXPub()).toMatch(/^vpub/);
        });
    });
    // ── ROUND-TRIP: MNEMONIC → EXTENDED KEY → REIMPORT ───────────────────────
    // Note: watch-only (xpub) round-trips cannot compare addresses with full wallets
    // because the exported xpub is the ROOT key. Watch-only derivation uses a relative
    // path (m/0/N) while full wallets use hardened paths (m/purpose'/coin'/acct'/0/N).
    // For address equality, an account-level xpub would be required.
    describe("round-trip: mnemonic → export extended key → reimport", () => {
        test("testnet BIP44: mnemonic → tprv → reimport as full wallet → same addresses", () => {
            const { wallet: original } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 44 });
            const tprv = original.getXPriv();
            const { wallet: restored } = hdwallet_1.HDWallet.import(tprv);
            expect(restored.isWatchOnly).toBe(false);
            expect(restored.network).toBe("testnet");
            expect(restored.getAddress(0)).toBe(original.getAddress(0));
            expect(restored.getAddress(1)).toBe(original.getAddress(1));
        });
        test("mainnet BIP84: mnemonic → zprv → reimport as full wallet → same addresses", () => {
            const { wallet: original } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const zprv = original.getXPriv();
            const { wallet: restored } = hdwallet_1.HDWallet.import(zprv);
            expect(restored.isWatchOnly).toBe(false);
            expect(restored.network).toBe("mainnet");
            expect(restored.getAddress(0)).toBe(original.getAddress(0));
        });
        test("testnet BIP84: mnemonic → vprv → reimport as full wallet → same addresses", () => {
            const { wallet: original } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            const vprv = original.getXPriv();
            const { wallet: restored } = hdwallet_1.HDWallet.import(vprv);
            expect(restored.isWatchOnly).toBe(false);
            expect(restored.network).toBe("testnet");
            expect(restored.getAddress(0)).toBe(original.getAddress(0));
        });
        test("mainnet BIP84: mnemonic → zpub (root) → watch-only derives bc1 addresses", () => {
            const { wallet: full } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 });
            const zpub = full.getXPub();
            const { wallet: watchOnly } = hdwallet_1.HDWallet.import(zpub);
            expect(watchOnly.isWatchOnly).toBe(true);
            expect(watchOnly.network).toBe("mainnet");
            watchOnly.listAddresses(3).forEach(addr => expect(addr).toMatch(/^bc1/));
        });
        test("testnet BIP84: mnemonic → vpub (root) → watch-only derives tb1 addresses", () => {
            const { wallet: full } = hdwallet_1.HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 });
            const vpub = full.getXPub();
            const { wallet: watchOnly } = hdwallet_1.HDWallet.import(vpub);
            expect(watchOnly.isWatchOnly).toBe(true);
            expect(watchOnly.network).toBe("testnet");
            watchOnly.listAddresses(3).forEach(addr => expect(addr).toMatch(/^tb1/));
        });
    });
});
//# sourceMappingURL=hdwallet.test.js.map