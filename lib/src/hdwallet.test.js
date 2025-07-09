"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hdwallet_1 = require("./hdwallet");
// jest.mock("@scure/bip39", () => ({
//     ...jest.requireActual("@scure/bip39"),
//     generateMnemonic: jest.fn(() => "visit tube task scout glass push sunny number top truck anchor hood")
// }));
const validMnemonic = "visit tube task scout glass push sunny number top truck anchor hood";
const validXPriv = "xprv9s21ZrQH143K2LQXAHgER7W7Sije5ovKHnqhurYDXSBYYLYKxxApnNo9i9mFrUFMxvKJAYhbZbB2USWZAYtgqZ8vaB8QqareQaSU8M1B3UC";
const validXPub = "xpub661MyMwAqRbcEpUzGKDEnFSqzka8VGeAf1mJiEwq5miXR8sUWVV5LB7dZUACgNFBxcuESbK7L3UtR8N3dFVdydEEztkuGVvjKz8MBVd5s8K";
const network = "testnet";
describe("HDWallet", () => {
    describe("create()", () => {
        test("should create a wallet with mnemonic", () => {
            var _a;
            const { mnemonic, wallet } = hdwallet_1.HDWallet.create(undefined, { network, purpose: 44 });
            expect((_a = mnemonic === null || mnemonic === void 0 ? void 0 : mnemonic.split(" ")) === null || _a === void 0 ? void 0 : _a.length).toBe(validMnemonic.split(" ").length);
            expect(wallet).toBeInstanceOf(hdwallet_1.HDWallet);
            expect(wallet.isWatchOnly).toBe(false);
            expect(wallet.network).toBe("testnet");
        });
    });
    describe("import()", () => {
        test("should import wallet from mnemonic", () => {
            const { mnemonic, wallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network, purpose: 44 });
            expect(mnemonic).toBe(validMnemonic);
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("should import wallet from xpriv", () => {
            const { wallet } = hdwallet_1.HDWallet.import(validXPriv, "", { network, purpose: 44 });
            expect(wallet.isWatchOnly).toBe(false);
        });
        test("should import wallet from xpub", () => {
            const { wallet } = hdwallet_1.HDWallet.import(validXPub, "", { network, purpose: 44 });
            expect(wallet.isWatchOnly).toBe(true);
        });
        test("should throw error for invalid mnemonic", () => {
            expect(() => hdwallet_1.HDWallet.import("visit tube task scout glass push rural number top truck anchor hood", "")).toThrow("Invalid seed phrase (mnemonic)");
        });
        test("should throw error for unsupported format", () => {
            expect(() => hdwallet_1.HDWallet.import("invalidkey")).toThrow("Unsupported or invalid HD wallet data format, expected mnemonic, xpriv or xpub.");
        });
    });
    describe("watch-only wallet", () => {
        const { wallet } = hdwallet_1.HDWallet.import(validXPub, "", { network, purpose: 44 });
        test("should return addresses", () => {
            const addresses = wallet.listAddresses(2);
            expect(addresses.length).toBe(2);
            expect(typeof addresses[0]).toBe("string");
        });
        test("should return public key", () => {
            const pubkey = wallet.getPublicKey(0);
            expect(pubkey instanceof Uint8Array).toBe(true);
        });
        test("should return address by index", () => {
            const address = wallet.getAddress(0);
            expect(typeof address).toBe("string");
        });
        test("should throw for private key derivation", () => {
            expect(() => wallet.getPrivateKey(0)).toThrow("The wallet only has the public key, it is read-only");
            expect(() => wallet.getPairKey(0)).toThrow("The wallet only has the public key, it is read-only");
            expect(() => wallet.getXPriv()).toThrow("The wallet only has the public key, it is read-only");
            expect(() => wallet.getMasterPrivateKey()).toThrow("The wallet only has the public key, it is read-only");
        });
        test("should return master public key", () => {
            const pub = wallet.getMasterPublicKey();
            expect(pub instanceof Uint8Array).toBe(true);
        });
    });
    describe("full access wallet", () => {
        const { wallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network, purpose: 44 });
        test("should return addresses", () => {
            const addresses = wallet.listAddresses(2);
            expect(addresses.length).toBe(2);
        });
        test("should return pair keys", () => {
            const keys = wallet.listPairKeys(2);
            expect(keys.length).toBe(2);
        });
        test("should derive a private key", () => {
            const key = wallet.getPrivateKey(0);
            expect(key instanceof Uint8Array).toBe(true);
        });
        test("should derive a public key", () => {
            const key = wallet.getPublicKey(0);
            expect(key instanceof Uint8Array).toBe(true);
        });
        test("should derive a pair key", () => {
            const pair = wallet.getPairKey(0);
            expect(pair).toBeDefined();
            expect(pair.getAddress()).toBeDefined();
        });
        test("should return master xpriv", () => {
            const xpriv = wallet.getXPriv();
            expect(typeof xpriv).toBe("string");
        });
        test("should return master xpub", () => {
            const xpub = wallet.getXPub();
            expect(typeof xpub).toBe("string");
        });
    });
    describe("invalid derivation indexes", () => {
        const { wallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network, purpose: 44 });
        test("should throw on negative index", () => {
            expect(() => wallet.getPrivateKey(-1)).toThrow();
            expect(() => wallet.getAddress(-1)).toThrow();
        });
        test("should throw on index > 2^31 - 1", () => {
            const tooBig = 2147483648;
            expect(() => wallet.getPrivateKey(tooBig)).toThrow();
        });
    });
});
//# sourceMappingURL=hdwallet.test.js.map