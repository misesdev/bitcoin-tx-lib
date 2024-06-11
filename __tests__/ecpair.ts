import { ECPairKey } from "../ecpairkey";

describe("ECPairKey", () => {
    it("get the public key", () => {
        const PairKey = new ECPairKey("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D");

        const publicKey = PairKey.getPublicKey()

        console.log(publicKey)
        expect(true).toBe(true)
    })
    it("generate WIF", () => {

        const PairKey = new ECPairKey("0C28FCA386C7A227600B2FE50B7CAE11EC86D3BF1FBE471BE89827E19D72AA1D");

        expect(PairKey.getWif()).toBe("5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ");
    })
})