import { ECPairKey } from "./ecpairkey";

describe("ECPairKey", () => {
    it("create keypair", () => {
        const PairKey = new ECPairKey()

        expect(PairKey.privateKey).toBeDefined()
    })
    it("get the public key", () => {
        const pairKey = new ECPairKey("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D");

        const publicKey = pairKey.getPublicKey()

        expect(publicKey).toBe("04d0de0aaeaefad02b8bdc8a01a1b8b11c696bd3d66a2c5f10780d95b7df42645cd85228a6fb29940e858e7e55842ae2bd115d1ed7cc0e82d934e929c97648cb0a")
    })
    it("get private key WIF", () => {
        const pairKey = new ECPairKey("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D");

        expect(pairKey.getWif()).toBe("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
    })
    it("sign and verify signature", () => {

        const pairKey = new ECPairKey("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D");

        const signature = pairKey.signHash("my name is optmus prime")

        const isValid = pairKey.verifySignature("my name is optmus prime", signature)

        expect(isValid).toBe(true)
    })
    it("import from wif", () => {
        var pairKey = ECPairKey.fromWif("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ")

        expect(pairKey.privateKey.toString().toUpperCase()).toBe("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D")

        var error = false
        var wifVersionError = "25JBG1P53WpDHnB1NFd9cSCZ9QdKS3fv5hqDbMte2bChDkmVhXa"
        try { pairKey = ECPairKey.fromWif(wifVersionError) } catch { error = true }
        // a validation error must occur, as the first byte, designated the version, is incorrect
        expect(error).toBe(true)

        error = false
        var wifChecksumError = "5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvykx"
        try { pairKey = ECPairKey.fromWif(wifChecksumError) } catch { error = true }
        // a validation error should occur because the last 4 bytes assigned to the checksum are incorrect
        expect(error).toBe(true)
    })
    it("get bitcoin address", () => {
        const pairKey = ECPairKey.fromWif("5KCyEgVQ93iZoJ81tYrknfpry9LopRhJgBTdMFsapamox69wdar")//new ECPairKey()

        const address = pairKey.getAddress()

        expect(address).toBeDefined()
        expect(address).toBe("1Mr6dG4BtavXCtaKPaxQpdXHWyCVvMbxtY")
    })
})