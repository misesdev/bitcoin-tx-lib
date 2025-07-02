import { ECPairKey } from "../ecpairkey"
import { InputTransaction, OutputTransaction } from "../types"
import { SigParams, TransactionBuilder } from "./txbuilder"

class TestTransactionBuilder extends TransactionBuilder {
    public build(params: SigParams) {
        return this.buildAndSign(params)
    }
    public testGenerateScriptSig(input: InputTransaction, params: SigParams) {
        return this.generateScriptSig(input, params)
    }
    public testGenerateWitness(input: InputTransaction, params: SigParams) {
        return this.generateWitness(input, params)
    }
    public testValidateInput(input: InputTransaction, inputs: InputTransaction[]) {
        return this.validateInput(input, inputs)
    }
    public testValidateOutput(output: OutputTransaction, outputs: OutputTransaction[]) {
        return this.validateOutput(output, outputs)
    }
    public testOutputsRaw(outputs: OutputTransaction[]) {
        return this.outputsRaw(outputs)
    }
}

describe("TransactionBuilder", () => {
    const pairKey = new ECPairKey()

    const baseInput: InputTransaction = {
        txid: "a".repeat(64),
        vout: 0,
        scriptPubKey: "0014" + "ab".repeat(20), // P2WPKH
        value: 50000
    }

    const baseOutput: OutputTransaction = {
        address: pairKey.getAddress(),
        amount: 49000
    }

    const baseParams: SigParams = {
        inputs: [baseInput],
        outputs: [baseOutput],
        pairkey: pairKey,
        locktime: 0,
        version: 2
    }

    let builder: TestTransactionBuilder

    beforeEach(() => {
        builder = new TestTransactionBuilder()
    })

    test("detects segwit input", () => {
        expect(builder.isSegwit([baseInput])).toBe(true)
    })

    test("detects non-segwit input", () => {
        const input = { ...baseInput, scriptPubKey: "76a914" + "ab".repeat(20) + "88ac" }
        expect(builder.isSegwit([input])).toBe(false)
    })

    test("builds and signs segwit transaction", () => {
        const raw = builder.build(baseParams)
        expect(raw).toBeInstanceOf(Uint8Array)
        expect(raw.length).toBeGreaterThan(0)
    })

    test("generates scriptSig correctly", () => {
        const input = { ...baseInput, scriptPubKey: "76a914" + "ab".repeat(20) + "88ac" }
        const sig = builder.testGenerateScriptSig(input, { ...baseParams, inputs: [input] })
        expect(sig).toBeInstanceOf(Uint8Array)
        expect(sig.length).toBeGreaterThan(0)
    })

    test("generates witness correctly", () => {
        const witness = builder.testGenerateWitness(baseInput, baseParams)
        expect(witness).toBeInstanceOf(Uint8Array)
        expect(witness.length).toBeGreaterThan(0)
    })

    test("validates valid input", () => {
        expect(() => builder.testValidateInput(baseInput, [])).not.toThrow()
    })

    test("throws on invalid txid length", () => {
        const input = { ...baseInput, txid: "1234" }
        expect(() => builder.testValidateInput(input, [])).toThrow("Expected a valid txid")
    })

    test("throws on missing scriptPubKey", () => {
        const input = { ...baseInput, scriptPubKey: "" }
        expect(() => builder.testValidateInput(input, [])).toThrow("Expected scriptPubKey")
    })

    test("throws on duplicated txid", () => {
        expect(() => builder.testValidateInput(baseInput, [baseInput])).toThrow("already been added")
    })

    test("validates output", () => {
        expect(() => builder.testValidateOutput(baseOutput, [])).not.toThrow()
    })

    test("throws on invalid output amount", () => {
        const output = { ...baseOutput, amount: 0 }
        expect(() => builder.testValidateOutput(output, [])).toThrow("valid amount")
    })

    test("throws on invalid address", () => {
        const output = { ...baseOutput, address: "invalid" }
        expect(() => builder.testValidateOutput(output, [])).toThrow("valid address")
    })

    test("throws on duplicated output address", () => {
        expect(() => builder.testValidateOutput(baseOutput, [baseOutput])).toThrow("already been added")
    })

    test("serializes outputs", () => {
        const raw = builder.testOutputsRaw([baseOutput])
        expect(raw).toBeInstanceOf(Uint8Array)
        expect(raw.length).toBeGreaterThan(0)
    })
})
