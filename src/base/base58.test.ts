import { Base58 } from "./base58"

describe("base58 convert", () => {

    test("convert hexadecimal bytes in base 58", () => {
        let address = Base58.encode("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7")

        expect(address).toBe("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt")
    })

    test("decode base58 to hexadecimal bytes", () => {
        let hex = Base58.decode("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt")

        expect(hex).toBe("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7")
    })
})
