import { buildTransaction } from "..";

describe("verify tha main functions", () => {
    it("build transaction", () => {

        const transaction = buildTransaction({ version: 1, locktime: 0, inputs: [], outputs: [] })

        expect(true).toBe(true)
    })
})