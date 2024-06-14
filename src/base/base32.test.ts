import { Base32 } from "./base32"

describe("base32 convert", () => {
    it("convert hexadecimal to base32", () => {

        var base32 = Base32.encode("21fc2dcf7c7e8113798cdcc763bc8235046ff176f6faa9f2ee7c")

        expect(base32).toBe(base32) // implement laterr
    })
    it("convert base32 to hexadecimal", () => {
        var hex = Base32.decode("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")

        expect(hex).toBe(hex) // implement later
    })
})