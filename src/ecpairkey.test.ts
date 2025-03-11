import { ECPairKey } from "./ecpairkey";
import { bytesToHex } from "./utils";

describe("ECPairKey", () => {
    it("create keypair", () => {
        const PairKey = new ECPairKey()

        expect(PairKey.privateKey).toBeDefined()
    })
    it("get the public key", () => {
        const pairKey = new ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" });

        const publicKey = pairKey.getPublicKey()

        expect(publicKey).toBe("04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a")
    })
    it("get compressed public key", () => {
        let pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ")

        const compressed = pairKey.getPublicKeyCompressed()

        expect(compressed).toBe("28kHHhJyWxNygyPe8oguQb8RPP8mgox4U92z6emdaQnZZ")
    })
    it("get private key WIF", () => {
        const pairKey = new ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" });

        expect(pairKey.getWif()).toBe("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
    })
    it("get public key WIF", () => {
        const pairKey = new ECPairKey({ privateKey: "0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d" })

        const publicWif = pairKey.getPublicWif()

        expect(publicWif).toBe("KwdMAjGmerYanjeui5SHS7JkmpZvVipYvB2LJGU1ZxJwYvP98617")
    })
    it("sign and verify signature", () => {

        let pairKey = new ECPairKey({ privateKey: "16260783e40b16731673622ac8a5b045fc3ea4af70f727f3f9e92bdd3a1ddc42" });

        let signature = pairKey.signHash("6244980fa0752e5b4643edb353fda5238a9a3d44491676788efdd25dd64855ba")

        expect(signature).toBe("304402205598d37448064924b0e4b0d43f74625f1c87da0c7e56266b48081ce0fa69ec850220067581bbc97b9f7dd9d5b67fd2558e7c516c2b71c5f0f472b3e290a086a5696d")
        
        let isValid = pairKey.verifySignature("6244980fa0752e5b4643edb353fda5238a9a3d44491676788efdd25dd64855ba", signature)

        expect(isValid).toBe(true)
    })
    it("import from wif", () => {
        let pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ")

        expect(pairKey.privateKey).toBe("0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d")

        let error = false
        let wifVersionError = "25JBG1P53WpDHnB1NFd9cSCZ9QdKS3fv5hqDbMte2bChDkmVhXa"
        try { pairKey = ECPairKey.fromWif(wifVersionError) } catch { error = true }
        // a validation error must occur, as the first byte, designated the version, is incorrect
        expect(error).toBe(true)

        error = false
        let wifChecksumError = "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvykx"
        try { pairKey = ECPairKey.fromWif(wifChecksumError) } catch { error = true }
        // a validation error should occur because the last 4 bytes assigned to the checksum are incorrect
        expect(error).toBe(true)
    })
    it("import from hex", () => {
        const pairKey = ECPairKey.fromHex({ 
            privateKey: "9d01e9e28cba0217c5826838596733b2cf86a54fff3eabcabec90a2acdc101d8", 
            network: "testnet" 
        })
        
        const address = pairKey.getAddress(true)

        expect(address).toBe("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")
    })
    it("get bitcoin address", () => {
        const pairKey = ECPairKey.fromWif("5KCyEgVQ93iZoJ81tYrknfpry9LopRhJgBTdMFsapamox69wdar")//new ECPairKey()

        let address = pairKey.getAddress()

        expect(address).toBeDefined()
        expect(address).toBe("1Mr6dG4BtavXCtaKPaxQpdXHWyCVvMbxtY")

        address = pairKey.getAddress(true) // bech32
        expect(address).toBe("bc1qv3p9y96wr7xn2dq80vz99dxtf7ed4zvcpdemk6")
    })
})
