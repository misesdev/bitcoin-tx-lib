import { Base58 } from "./base58"

describe("base58 convert", () => {
    it("convert hexadecimal bytes in base 58", () => {
        var address = Base58.encode("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7")

        expect(address).toBe("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt")
    })
    it("decode base58 to hexadecimal bytes", () => {
        var hex = Base58.decode("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt")

        expect(hex).toBe("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7")
    })
})