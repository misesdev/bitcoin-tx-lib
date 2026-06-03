import { HDWallet } from "./hdwallet"
import { ECPairKey } from "./ecpairkey"
import { BNetwork } from "./types"
import { bytesToHex } from "./utils"
import { MnemonicUtils } from "./utils/mnemonic"

const MNEMONIC_A = "visit tube task scout glass push sunny number top truck anchor hood"
const XPRIV = "xprv9s21ZrQH143K2LQXAHgER7W7Sije5ovKHnqhurYDXSBYYLYKxxApnNo9i9mFrUFMxvKJAYhbZbB2USWZAYtgqZ8vaB8QqareQaSU8M1B3UC"
const XPUB  = "xpub661MyMwAqRbcEpUzGKDEnFSqzka8VGeAf1mJiEwq5miXR8sUWVV5LB7dZUACgNFBxcuESbK7L3UtR8N3dFVdydEEztkuGVvjKz8MBVd5s8K"
const NETWORK: BNetwork = "testnet"

describe("HDWallet", () => {

    describe("create()", () => {
        test("generates 12-word mnemonic and a full wallet", () => {
            const { mnemonic, wallet } = HDWallet.create(undefined, { network: NETWORK, purpose: 44 })
            expect(mnemonic?.split(" ").length).toBe(12)
            expect(wallet).toBeInstanceOf(HDWallet)
            expect(wallet.isWatchOnly).toBe(false)
            expect(wallet.network).toBe(NETWORK)
        })

        test("mnemonic is a valid BIP39 phrase", () => {
            const { mnemonic } = HDWallet.create()
            expect(MnemonicUtils.validateMnemonic(mnemonic!)).toBe(true)
        })
    })

    describe("import()", () => {
        test("imports from mnemonic and preserves it in return value", () => {
            const { mnemonic, wallet } = HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 })
            expect(mnemonic).toBe(MNEMONIC_A)
            expect(wallet.isWatchOnly).toBe(false)
        })

        test("imports from xpriv as full wallet", () => {
            const { wallet } = HDWallet.import(XPRIV, "", { network: NETWORK })
            expect(wallet.isWatchOnly).toBe(false)
        })

        test("imports from xpub as watch-only", () => {
            const { wallet } = HDWallet.import(XPUB, "", { network: NETWORK })
            expect(wallet.isWatchOnly).toBe(true)
        })

        test("trims whitespace from mnemonic input", () => {
            const padded = "  " + MNEMONIC_A + "  "
            const { wallet } = HDWallet.import(padded)
            expect(wallet.isWatchOnly).toBe(false)
        })

        test("throws on invalid mnemonic (wrong word)", () => {
            expect(() =>
                HDWallet.import("visit tube task scout glass push rural number top truck anchor hood")
            ).toThrow("Invalid seed phrase (mnemonic)")
        })

        test("throws on unsupported format", () => {
            expect(() =>
                HDWallet.import("not_a_valid_key_or_mnemonic")
            ).toThrow("Unsupported or invalid HD wallet data format")
        })
    })

    // ── PURPOSE PROPAGATION — anti-regression for bug fix #2 ──────────────────
    describe("purpose propagation — address type anti-regression", () => {
        test("purpose:44 + mainnet → p2pkh addresses starting with 1", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 44 })
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^1/))
        })

        test("purpose:44 + testnet → p2pkh addresses starting with m or n", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 44 })
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^[mn]/))
        })

        test("purpose:84 + mainnet → p2wpkh addresses starting with bc1", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^bc1/))
        })

        test("purpose:84 + testnet → p2wpkh addresses starting with tb1", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 })
            wallet.listAddresses(3).forEach(addr => expect(addr).toMatch(/^tb1/))
        })

        test("purpose:44 and purpose:84 produce distinct addresses from same mnemonic", () => {
            const { wallet: w44 } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 44 })
            const { wallet: w84 } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            expect(w44.getAddress(0)).not.toBe(w84.getAddress(0))
        })
    })

    // ── DETERMINISTIC DERIVATION ───────────────────────────────────────────────
    describe("deterministic derivation", () => {
        test("same mnemonic always produces same address at index 0", () => {
            const { wallet: w1 } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            const { wallet: w2 } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            expect(w1.getAddress(0)).toBe(w2.getAddress(0))
        })

        test("different indexes produce different addresses", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            expect(wallet.getAddress(0)).not.toBe(wallet.getAddress(1))
        })

        test("different mnemonics produce different addresses", () => {
            const { mnemonic: mnemonicX } = HDWallet.create()
            const { wallet: wA } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            const { wallet: wB } = HDWallet.import(mnemonicX!, "", { network: "mainnet", purpose: 84 })
            expect(wA.getAddress(0)).not.toBe(wB.getAddress(0))
        })
    })

    // ── RECEIVE vs CHANGE ADDRESSES ───────────────────────────────────────────
    describe("receive vs change address separation", () => {
        let wallet: HDWallet
        beforeAll(() => { ({ wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })) })

        test("listReceiveAddresses returns 'quantity' addresses", () => {
            expect(wallet.listReceiveAddresses(5).length).toBe(5)
        })

        test("listChangeAddresses returns 'quantity' addresses", () => {
            expect(wallet.listChangeAddresses(5).length).toBe(5)
        })

        test("receive and change addresses do not overlap", () => {
            const receive = wallet.listReceiveAddresses(5)
            const change = wallet.listChangeAddresses(5)
            receive.forEach(addr => expect(change).not.toContain(addr))
        })

        test("same index on receive vs change chain produces different address", () => {
            const receive = wallet.listReceiveAddresses(1)
            const change = wallet.listChangeAddresses(1)
            expect(receive[0]).not.toBe(change[0])
        })

        test("listAddresses with change:0 matches listReceiveAddresses", () => {
            const fromListAddresses = wallet.listAddresses(3, { change: 0 })
            const fromReceive = wallet.listReceiveAddresses(3)
            expect(fromListAddresses).toEqual(fromReceive)
        })

        test("listAddresses with change:1 matches listChangeAddresses", () => {
            const fromListAddresses = wallet.listAddresses(3, { change: 1 })
            const fromChange = wallet.listChangeAddresses(3)
            expect(fromListAddresses).toEqual(fromChange)
        })
    })

    // ── WATCH-ONLY WALLET ──────────────────────────────────────────────────────
    describe("watch-only wallet", () => {
        const { wallet } = HDWallet.import(XPUB, "", { network: NETWORK, purpose: 44 })

        test("isWatchOnly is true", () => {
            expect(wallet.isWatchOnly).toBe(true)
        })

        test("can derive addresses", () => {
            const addresses = wallet.listAddresses(2)
            expect(addresses.length).toBe(2)
            addresses.forEach(addr => expect(typeof addr).toBe("string"))
        })

        test("can derive public key at index", () => {
            const pubkey = wallet.getPublicKey(0)
            expect(pubkey).toBeInstanceOf(Uint8Array)
            expect(pubkey.length).toBe(33)
        })

        test("can get master public key", () => {
            const pub = wallet.getMasterPublicKey()
            expect(pub).toBeInstanceOf(Uint8Array)
            expect(pub.length).toBe(33)
        })

        test("getPublicKey and getXPub return data without throwing", () => {
            expect(() => wallet.getPublicKey(0)).not.toThrow()
            expect(() => wallet.getXPub()).not.toThrow()
        })

        test("getPairKey throws for watch-only", () => {
            expect(() => wallet.getPairKey(0)).toThrow("The wallet only has the public key, it is read-only")
        })

        test("getPrivateKey throws for watch-only", () => {
            expect(() => wallet.getPrivateKey(0)).toThrow("The wallet only has the public key, it is read-only")
        })

        test("getXPriv throws for watch-only", () => {
            expect(() => wallet.getXPriv()).toThrow("The wallet only has the public key, it is read-only")
        })

        test("getMasterPrivateKey throws for watch-only", () => {
            expect(() => wallet.getMasterPrivateKey()).toThrow("The wallet only has the public key, it is read-only")
        })

        test("getWif throws for watch-only", () => {
            expect(() => wallet.getWif()).toThrow("The wallet only has the public key, it is read-only")
        })
    })

    // ── FULL WALLET ────────────────────────────────────────────────────────────
    describe("full access wallet", () => {
        const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 })

        test("listAddresses returns correct count", () => {
            expect(wallet.listAddresses(3).length).toBe(3)
        })

        test("listPairKeys returns correct count", () => {
            expect(wallet.listPairKeys(3).length).toBe(3)
        })

        test("getPrivateKey returns 32-byte Uint8Array", () => {
            const key = wallet.getPrivateKey(0)
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(32)
        })

        test("getPublicKey returns 33-byte Uint8Array", () => {
            const key = wallet.getPublicKey(0)
            expect(key).toBeInstanceOf(Uint8Array)
            expect(key.length).toBe(33)
        })

        test("getPairKey returns ECPairKey with valid address", () => {
            const pair = wallet.getPairKey(0)
            expect(pair).toBeInstanceOf(ECPairKey)
            expect(typeof pair.getAddress()).toBe("string")
        })

        test("getXPriv returns non-empty string", () => {
            expect(typeof wallet.getXPriv()).toBe("string")
            expect(wallet.getXPriv().length).toBeGreaterThan(0)
        })

        test("getXPub returns non-empty string", () => {
            expect(typeof wallet.getXPub()).toBe("string")
            expect(wallet.getXPub().length).toBeGreaterThan(0)
        })
    })

    // ── getWif ────────────────────────────────────────────────────────────────
    describe("getWif", () => {
        test("mainnet wallet: getWif returns K/L-prefixed compressed WIF", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            const wif = wallet.getWif()
            expect(typeof wif).toBe("string")
            expect(wif[0]).toMatch(/^[KL]/)
        })

        test("testnet wallet: getWif returns c-prefixed compressed WIF", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "testnet", purpose: 84 })
            expect(wallet.getWif()[0]).toBe("c")
        })

        test("getWif round-trips to master private key", () => {
            const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: "mainnet", purpose: 84 })
            const wif = wallet.getWif()
            const recovered = ECPairKey.fromWif(wif)
            const masterPriv = wallet.getMasterPrivateKey()
            expect(bytesToHex(recovered.getPrivateKey())).toBe(bytesToHex(masterPriv))
        })
    })

    // ── INVALID INDEX BOUNDS ──────────────────────────────────────────────────
    describe("invalid derivation indexes", () => {
        const { wallet } = HDWallet.import(MNEMONIC_A, "", { network: NETWORK, purpose: 44 })

        test("negative index throws", () => {
            expect(() => wallet.getPrivateKey(-1)).toThrow()
            expect(() => wallet.getAddress(-1)).toThrow()
            expect(() => wallet.getPublicKey(-1)).toThrow()
        })

        test("index > 2^31-1 throws", () => {
            const tooBig = 2147483648
            expect(() => wallet.getPrivateKey(tooBig)).toThrow()
            expect(() => wallet.getPublicKey(tooBig)).toThrow()
        })
    })
})
