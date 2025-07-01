"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hdwallet_1 = require("../hdwallet");
jest.mock("bip39", () => (Object.assign(Object.assign({}, jest.requireActual("bip39")), { generateMnemonic: jest.fn(() => "visit tube task scout glass push sunny number top truck anchor hood") })));
const validMnemonic = "visit tube task scout glass push sunny number top truck anchor hood";
const validXPriv = "xprv9s21ZrQH143K2LQXAHgER7W7Sije5ovKHnqhurYDXSBYYLYKxxApnNo9i9mFrUFMxvKJAYhbZbB2USWZAYtgqZ8vaB8QqareQaSU8M1B3UC";
const validXPub = "xpub661MyMwAqRbcEpUzGKDEnFSqzka8VGeAf1mJiEwq5miXR8sUWVV5LB7dZUACgNFBxcuESbK7L3UtR8N3dFVdydEEztkuGVvjKz8MBVd5s8K";
const network = "testnet";
describe("HDWallet", () => {
    describe("create()", () => {
        it("should create a wallet with mnemonic", () => {
            const { mnemonic, hdwallet } = hdwallet_1.HDWallet.create(undefined, { network });
            expect(mnemonic).toBe(validMnemonic);
            expect(hdwallet).toBeInstanceOf(hdwallet_1.HDWallet);
            expect(hdwallet.isWatchOnly).toBe(false);
            expect(hdwallet.network).toBe("testnet");
        });
    });
    describe("import()", () => {
        it("should import wallet from mnemonic", () => {
            const { mnemonic, hdwallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network });
            expect(mnemonic).toBe(validMnemonic);
            expect(hdwallet.isWatchOnly).toBe(false);
        });
        it("should import wallet from xpriv", () => {
            const { hdwallet } = hdwallet_1.HDWallet.import(validXPriv, "", { network });
            expect(hdwallet.isWatchOnly).toBe(false);
        });
        it("should import wallet from xpub", () => {
            const { hdwallet } = hdwallet_1.HDWallet.import(validXPub, "", { network });
            expect(hdwallet.isWatchOnly).toBe(true);
        });
        it("should throw error for invalid mnemonic", () => {
            expect(() => hdwallet_1.HDWallet.import("visit tube task scout glass push rural number top truck anchor hood", "")).toThrow("Invalid seed phrase (mnemonic)");
        });
        it("should throw error for unsupported format", () => {
            expect(() => hdwallet_1.HDWallet.import("invalidkey")).toThrow("Unsupported or invalid HD wallet data format, expected mnemonic, xpriv or xpub.");
        });
    });
    describe("watch-only wallet", () => {
        const { hdwallet } = hdwallet_1.HDWallet.import(validXPub, "", { network });
        it("should return addresses", () => {
            const addresses = hdwallet.listAddresses(2);
            expect(addresses.length).toBe(2);
            expect(typeof addresses[0]).toBe("string");
        });
        it("should return public key", () => {
            const pubkey = hdwallet.getPublicKey(0);
            expect(pubkey instanceof Uint8Array).toBe(true);
        });
        it("should return address by index", () => {
            const address = hdwallet.getAddress(0);
            expect(typeof address).toBe("string");
        });
        it("should throw for private key derivation", () => {
            expect(() => hdwallet.getPrivateKey(0)).toThrow("The wallet only has the public key, it is read-only");
            expect(() => hdwallet.getPairKey(0)).toThrow("The wallet only has the public key, it is read-only");
            expect(() => hdwallet.getXPriv()).toThrow("The wallet only has the public key, it is read-only");
            expect(() => hdwallet.getMasterPrivateKey()).toThrow("The wallet only has the public key, it is read-only");
        });
        it("should return master public key", () => {
            const pub = hdwallet.getMasterPublicKey();
            expect(pub instanceof Uint8Array).toBe(true);
        });
    });
    describe("full access wallet", () => {
        const { hdwallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network });
        it("should return addresses", () => {
            const addresses = hdwallet.listAddresses(2);
            expect(addresses.length).toBe(2);
        });
        it("should return pair keys", () => {
            const keys = hdwallet.listPairKeys(2);
            expect(keys.length).toBe(2);
        });
        it("should derive a private key", () => {
            const key = hdwallet.getPrivateKey(0);
            expect(key instanceof Uint8Array).toBe(true);
        });
        it("should derive a public key", () => {
            const key = hdwallet.getPublicKey(0);
            expect(key instanceof Uint8Array).toBe(true);
        });
        it("should derive a pair key", () => {
            const pair = hdwallet.getPairKey(0);
            expect(pair).toBeDefined();
            expect(pair.getAddress()).toBeDefined();
        });
        it("should return master xpriv", () => {
            const xpriv = hdwallet.getXPriv();
            expect(typeof xpriv).toBe("string");
        });
        it("should return master xpub", () => {
            const xpub = hdwallet.getXPub();
            expect(typeof xpub).toBe("string");
        });
    });
    describe("invalid derivation indexes", () => {
        const { hdwallet } = hdwallet_1.HDWallet.import(validMnemonic, "", { network });
        it("should throw on negative index", () => {
            expect(() => hdwallet.getPrivateKey(-1)).toThrow();
            expect(() => hdwallet.getAddress(-1)).toThrow();
        });
        it("should throw on index > 2^31 - 1", () => {
            const tooBig = 2147483648;
            expect(() => hdwallet.getPrivateKey(tooBig)).toThrow();
        });
    });
});
//# sourceMappingURL=index.test.js.map