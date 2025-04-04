"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ecpairkey_1 = require("./ecpairkey");
describe("ECPairKey", () => {
    test("create keypair", () => {
        const PairKey = new ecpairkey_1.ECPairKey();
        expect(PairKey.privateKey).toBeDefined();
    });
    test("get the public key", () => {
        const pairKey = new ecpairkey_1.ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" });
        const publicKey = pairKey.getPublicKey();
        expect(publicKey).toBe("04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a");
    });
    test("get compressed public key", () => {
        let pairKey = ecpairkey_1.ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
        const compressed = pairKey.getPublicKeyCompressed();
        expect(compressed).toBe("qWxvCXDvALEvQJriaWj7Pucs8e8N4jzNez2mnrCotqKH");
    });
    test("get private key WIF", () => {
        const pairKey = new ecpairkey_1.ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" });
        expect(pairKey.getWif()).toBe("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
    });
    test("get public key WIF", () => {
        const pairKey = new ecpairkey_1.ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" });
        const publicWif = pairKey.getPublicWif();
        expect(publicWif).toBe("KwdMAjGmerYanjeui5SHS7JkmpZvVipYvB2LJGU1ZxJwYvP98617");
    });
    test("sign and verify signature", () => {
        let pairKey = new ecpairkey_1.ECPairKey({ privateKey: "16260783e40b16731673622ac8a5b045fc3ea4af70f727f3f9e92bdd3a1ddc42" });
        let signature = pairKey.signDER("6244980fa0752e5b4643edb353fda5238a9a3d44491676788efdd25dd64855ba");
        let isValid = pairKey.verifySignature("6244980fa0752e5b4643edb353fda5238a9a3d44491676788efdd25dd64855ba", signature);
        expect(isValid).toBe(true);
    });
    test("import from wif", () => {
        let pairKey = ecpairkey_1.ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
        expect(pairKey.privateKey).toBe("0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d");
        let error = false;
        let wifVersionError = "25JBG1P53WpDHnB1NFd9cSCZ9QdKS3fv5hqDbMte2bChDkmVhXa";
        try {
            pairKey = ecpairkey_1.ECPairKey.fromWif(wifVersionError);
        }
        catch (_a) {
            error = true;
        }
        finally {
            // a validation error must occur, as the first byte, designated the version, is incorrect
            expect(error).toBe(true);
        }
        error = false;
        let wifChecksumError = "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvykx";
        try {
            pairKey = ecpairkey_1.ECPairKey.fromWif(wifChecksumError);
        }
        catch (_b) {
            error = true;
        }
        // a validation error should occur because the last 4 bytes assigned to the checksum are incorrect
        expect(error).toBe(true);
    });
    test("import from hex", () => {
        const pairKey = ecpairkey_1.ECPairKey.fromHex({
            privateKey: "9d01e9e28cba0217c5826838596733b2cf86a54fff3eabcabec90a2acdc101d8",
            network: "testnet"
        });
        const address = pairKey.getAddress("p2wpkh");
        expect(address).toBe("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj");
    });
    test("get bitcoin address", () => {
        const pairKey = ecpairkey_1.ECPairKey.fromWif("5KCyEgVQ93iZoJ81tYrknfpry9LopRhJgBTdMFsapamox69wdar");
        let address = pairKey.getAddress("p2pkh");
        expect(address).toBeDefined();
        expect(address).toBe("1Kj9UWTgPmzWrmHnFUx1hGzKi3A4R5e1NA");
        address = pairKey.getAddress("p2wpkh"); // bech32
        expect(address).toBe("bc1qe44vaalmg0yxd56wav8xhtqp5xe30fe7mxws4z");
    });
});
//# sourceMappingURL=ecpairkey.test.js.map