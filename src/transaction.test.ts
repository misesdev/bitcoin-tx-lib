import { ECPairKey } from "./ecpairkey"
import { Transaction } from "./transaction"
import { InputTransaction, OutputTransaction } from "./types"
import { hexToBytes, hash256, numberToHexLE, numberToVarint } from "./utils"
import { ByteBuffer } from "./utils/buffer"
import { scriptPubkeyToScriptCode } from "./utils/txutils"
import { secp256k1 } from "@noble/curves/secp256k1.js"
import { OP_CODES } from "./constants/opcodes"

describe("transaction class", () => {

    let pairkey: ECPairKey
    let transaction: Transaction

    beforeEach(() => {
        pairkey = ECPairKey.fromWif("92n4i3QMN55FTaxZh7JUz3QLg5HkawCDjh4AEcBwpvK61YX893g")
        transaction = new Transaction(pairkey)
    })

    test("Must add a valid entry", () => {
        const input: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        }
        transaction.addInput(input)
        expect(transaction.inputs).toContainEqual(input)
    })

    test("Should throw error when adding entry with duplicate txid+vout", () => {
        const input: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        }
        transaction.addInput(input)
        expect(() => transaction.addInput(input)).toThrow("An input with this utxo (txid:vout) has already been added")
    })

    test("Should allow two inputs from the same txid but different vout", () => {
        const input0: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 10000,
            vout: 0
        }
        const input1: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 19128,
            vout: 1
        }
        transaction.addInput(input0)
        expect(() => transaction.addInput(input1)).not.toThrow()
        expect(transaction.inputs.length).toBe(2)
    })

    test("Must add a valid output", () => {
        const output: OutputTransaction = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 29128
        }
        transaction.addOutput(output)
        expect(transaction.outputs).toContainEqual(output)
    })

    test("Should throw error when adding output with invalid address", () => {
        const output: OutputTransaction = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg8vh8hlvf",
            amount: 29128
        }
        expect(() => transaction.addOutput(output)).toThrow("Expected a valid address to output")
    })

    test("Should throw error when adding output with already existing address", () => {
        const output: OutputTransaction = {
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 29128
        }
        transaction.addOutput(output)
        expect(() => transaction.addOutput(output)).toThrow("An output with this address has already been added")
    })

    test("Must assemble a non-witness P2PKH transaction", () => {
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128,
            vout: 1
        })

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        })

        transaction.sign()

        expect(transaction.isSegwit()).toBe(false)
        // P2PKH weight varies by DER signature length (70–72 bytes × 4 weight factor)
        expect(transaction.weight()).toBeGreaterThanOrEqual(752)
        expect(transaction.weight()).toBeLessThanOrEqual(764)
        expect(transaction.vBytes()).toBeGreaterThanOrEqual(188)
        expect(transaction.vBytes()).toBeLessThanOrEqual(191)
    })

    test("Must set up a P2WPKH segregated witness transaction", () => {
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 29128,
            vout: 1
        })

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500
        })

        transaction.sign()

        expect(transaction.getTxid()).toMatch(/^[0-9a-f]{64}$/)
        expect(transaction.isSegwit()).toBe(true)
        // SegWit witness bytes have weight 1 vs 4 for non-witness; DER sig varies 70–72 bytes
        expect(transaction.weight()).toBeGreaterThanOrEqual(437)
        expect(transaction.weight()).toBeLessThanOrEqual(442)
        expect(transaction.vBytes()).toBeGreaterThanOrEqual(110)
        expect(transaction.vBytes()).toBeLessThanOrEqual(111)
    })

    test("Must resolve network fee for payer exit", () => {
        transaction = new Transaction(pairkey, {
            whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        })
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        })
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        })

        transaction.sign()
        transaction.resolveFee()

        expect(transaction.getTxid()).toMatch(/^[0-9a-f]{64}$/)
        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toEqual(15000)
        expect(transaction.getFeeSats()).toBeGreaterThanOrEqual(140)
        expect(transaction.getFeeSats()).toBeLessThanOrEqual(143)
        expect(transaction.weight()).toBeGreaterThanOrEqual(556)
        expect(transaction.weight()).toBeLessThanOrEqual(570)
        expect(transaction.vBytes()).toBeGreaterThanOrEqual(139)
        expect(transaction.vBytes()).toBeLessThanOrEqual(143)
    })

    test("Must resolve network fee for receiver output", () => {
        transaction = new Transaction(pairkey, {
            whoPayTheFee: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        })
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        })
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        })

        transaction.sign()
        transaction.resolveFee()

        expect(transaction.getTxid()).toMatch(/^[0-9a-f]{64}$/)
        expect(transaction.outputs[0]?.amount).toEqual(15000)
        expect(transaction.outputs[1]?.amount).toBeLessThan(15000)
        expect(transaction.getFeeSats()).toBeGreaterThanOrEqual(140)
        expect(transaction.getFeeSats()).toBeLessThanOrEqual(143)
        expect(transaction.weight()).toBeGreaterThanOrEqual(556)
        expect(transaction.weight()).toBeLessThanOrEqual(570)
        expect(transaction.vBytes()).toBeGreaterThanOrEqual(139)
        expect(transaction.vBytes()).toBeLessThanOrEqual(143)
    })

    test("Must solve the network fee by distributing the cost equally to all outputs", () => {
        transaction = new Transaction(pairkey, {
            whoPayTheFee: "everyone",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        })
        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: 15000
        })
        transaction.addOutput({
            address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            amount: 15000
        })

        transaction.sign()
        transaction.resolveFee()

        expect(transaction.getTxid()).toMatch(/^[0-9a-f]{64}$/)
        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toBeLessThan(15000)
        expect(transaction.getFeeSats()).toBeGreaterThanOrEqual(140)
        expect(transaction.getFeeSats()).toBeLessThanOrEqual(143)
        expect(transaction.weight()).toBeGreaterThanOrEqual(556)
        expect(transaction.weight()).toBeLessThanOrEqual(570)
        expect(transaction.vBytes()).toBeGreaterThanOrEqual(139)
        expect(transaction.vBytes()).toBeLessThanOrEqual(143)
    })

    test("resolveFee is idempotent: calling twice does not double-deduct", () => {
        transaction = new Transaction(pairkey, {
            whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            fee: 1
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000,
            vout: 1
        })
        transaction.addOutput({ address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf", amount: 15000 })
        transaction.addOutput({ address: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj", amount: 15000 })

        transaction.sign()
        transaction.resolveFee()
        const amountAfterFirst = transaction.outputs[0].amount

        transaction.resolveFee()
        expect(transaction.outputs[0].amount).toBe(amountAfterFirst)
    })

    // ── SIGNATURE VALIDITY — anti-regression for @noble/curves v2 prehash bug ─
    // Before the fix, @noble/curves v2 default prehash:true caused the library to sign
    // sha256(sighash) instead of sighash. Our internal verify() was consistent (also
    // applied prehash) so tests passed, but every Bitcoin node rejected the transaction.
    describe("signature validity — prehash:false regression", () => {

        function bip143SigHash(
            txid: string, vout: number, scriptPubKey: string,
            value: number, sequence: string, outputAddr: string,
            outputAmount: number, version: number, locktime: number
        ): Uint8Array {
            const prevout = new ByteBuffer(hexToBytes(txid).reverse())
            prevout.append(numberToHexLE(vout, 32))
            const hashPrevouts = hash256(prevout.raw())

            const seqBytes = hexToBytes(sequence).reverse()
            const hashSequence = hash256(seqBytes)

            const scriptCode = scriptPubkeyToScriptCode(scriptPubKey)

            // output serialisation for hashOutputs
            const spkBytes = hexToBytes(scriptPubKey)
            const outBuf = new ByteBuffer(numberToHexLE(outputAmount, 64))
            outBuf.append(numberToVarint(spkBytes.length))
            outBuf.append(spkBytes)
            const hashOutputs = hash256(outBuf.raw())

            const preimage = new ByteBuffer(numberToHexLE(version, 32))
            preimage.append(hashPrevouts)
            preimage.append(hashSequence)
            preimage.append(hexToBytes(txid).reverse())
            preimage.append(numberToHexLE(vout, 32))
            preimage.append(scriptCode)
            preimage.append(numberToHexLE(value, 64))
            preimage.append(hexToBytes(sequence).reverse())
            preimage.append(hashOutputs)
            preimage.append(numberToHexLE(locktime, 32))
            preimage.append(numberToHexLE(OP_CODES.SIGHASH_ALL, 32))

            return hash256(preimage.raw())
        }

        test("P2WPKH: witness signature passes raw secp256k1 verify (prehash:false)", () => {
            const privHex = "1111111111111111111111111111111111111111111111111111111111111111"
            const pair = ECPairKey.fromHex(privHex, "mainnet")
            const scriptPubKey = "0014fc7250a211deddc70ee5a2738de5f07817351cef"
            const txid = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

            const tx = new Transaction(pair)
            tx.addInput({ txid, vout: 0, value: 100000, scriptPubKey })
            tx.addOutput({ address: pair.getAddress("p2wpkh"), amount: 90000 })
            tx.sign()

            // Extract witness signature from the raw transaction
            const raw = tx.getRawBytes()
            // Structure: version(4) + marker(1) + flag(1) + inputCount(1) + txid(32) + vout(4)
            //            + scriptSigLen(1=0) + sequence(4) + outputCount(1) + amount(8) + spkLen(1)
            //            + spk(22) + witnessItemCount(1) + sigLen(1) + sig...
            const witnessOffset = 4 + 2 + 1 + 32 + 4 + 1 + 4 + 1 + 8 + 1 + 22
            const sigLen = raw[witnessOffset + 1]  // witness item count=0x02, then sig length
            const sigBytes = raw.slice(witnessOffset + 2, witnessOffset + 2 + sigLen)
            // Remove the trailing SIGHASH_ALL byte for the raw DER sig
            const derSig = sigBytes.slice(0, -1)

            const expectedSigHash = bip143SigHash(
                txid, 0, scriptPubKey, 100000, "fffffffd",
                pair.getAddress("p2wpkh"), 90000, 2, 0
            )

            // This is exactly what Bitcoin Script does: verify DER sig against the raw sighash
            const valid = secp256k1.verify(derSig, expectedSigHash, pair.getPublicKey(), {
                format: 'der',
                prehash: false
            })
            expect(valid).toBe(true)
        })

        test("P2WPKH: witness signature fails if verified with prehash:true (double-hash)", () => {
            const privHex = "2222222222222222222222222222222222222222222222222222222222222222"
            const pair = ECPairKey.fromHex(privHex, "mainnet")
            const scriptPubKey = "00148d4498e5dbb2c6ef4f6ef37e95c4daec46c37e41"
            const txid = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"

            const tx = new Transaction(pair)
            tx.addInput({ txid, vout: 1, value: 50000, scriptPubKey })
            tx.addOutput({ address: pair.getAddress("p2wpkh"), amount: 45000 })
            tx.sign()

            const raw = tx.getRawBytes()
            const witnessOffset = 4 + 2 + 1 + 32 + 4 + 1 + 4 + 1 + 8 + 1 + 22
            const sigLen = raw[witnessOffset + 1]
            const sigBytes = raw.slice(witnessOffset + 2, witnessOffset + 2 + sigLen)
            const derSig = sigBytes.slice(0, -1)

            const expectedSigHash = bip143SigHash(
                txid, 1, scriptPubKey, 50000, "fffffffd",
                pair.getAddress("p2wpkh"), 45000, 2, 0
            )

            // prehash:true would mean the library re-hashes — this must be FALSE (the old bug)
            const wouldBeInvalid = secp256k1.verify(derSig, expectedSigHash, pair.getPublicKey(), {
                format: 'der',
                prehash: true
            })
            expect(wouldBeInvalid).toBe(false)
        })
    })
})


