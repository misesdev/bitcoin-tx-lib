import { ECPairKey } from "./ecpairkey"
import { Transaction } from "./transaction"
import { InputTransaction, OutputTransaction } from "./types"

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

    test("Should throw error when adding entry with duplicate txid", () => {
        const input: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128, 
            vout: 1
        }
        transaction.addInput(input)
        expect(() => transaction.addInput(input)).toThrow("An input with this txid has already been added")
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
        
        // let txid = transaction.getTxid()
        // let txraw = transaction.getRawHex()

        // console.log(txid)
        // console.log(txraw)

        // expect(transaction.getTxid()).toBe("a1b76bcd323417a9363cc21bef3aeab5cca5b6252c35c087f33ea2c0a3b43d55")
        expect(transaction.isSegwit()).toBe(false)
        expect(752).toEqual(transaction.weight())
        expect(188).toEqual(transaction.vBytes())
    })

    test("Must set up a P2PWKH segregated witness transaction", () => {
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

        expect(transaction.getTxid()).toBe("00a33f03ade6a8744084edb472931b8435ea545995e787333b75ff2e020f3915")
        expect(transaction.isSegwit()).toBe(true)
        expect(437).toEqual(transaction.weight())
        expect(110).toEqual(transaction.vBytes())
        expect(110).toEqual(transaction.getFeeSats())
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

        expect(transaction.getTxid()).toBe("b1ad7dd1537974123e3096157e7fdbb48feae06bc5d78c14d914cffdc67f3f08")
        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toEqual(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
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

        expect(transaction.getTxid()).toBe("b1ad7dd1537974123e3096157e7fdbb48feae06bc5d78c14d914cffdc67f3f08")
        expect(transaction.outputs[0]?.amount).toEqual(15000)
        expect(transaction.outputs[1]?.amount).toBeLessThan(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
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

        expect(transaction.getTxid()).toBe("b1ad7dd1537974123e3096157e7fdbb48feae06bc5d78c14d914cffdc67f3f08")
        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toBeLessThan(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
    })
})


