import { HDTransaction } from "./hdtransaction"
import { HDWallet } from "./hdwallet"
import { InputTransaction, OutputTransaction } from "./types"

describe("transaction class", () => {
    
    let wallet: HDWallet 
    let transaction: HDTransaction 

    beforeEach(() => {
        wallet = HDWallet.create().hdwallet
        transaction = new HDTransaction()
    })
    
    test("Must add a valid entry", () => {
        const input: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128, 
            vout: 1
        }
        transaction.addInput(input, wallet.getPairKey(0))
        expect(transaction.inputs).toContainEqual(input)
    })

    test("Should throw error when adding entry with duplicate txid", () => {
        const input: InputTransaction = {
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "76a914a8439c50793b033df810de257b313144a8f7edc988ac",
            value: 29128, 
            vout: 1
        }
        transaction.addInput(input, wallet.getPairKey(0))
        expect(() => transaction.addInput(input, wallet.getPairKey(1))).toThrow("An input with this txid has already been added")
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
        }, wallet.getPairKey(0))

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500 
        })

        transaction.sign()
        
        // let txid = transaction.getTxid()
        // let txraw = transaction.getRawHex()

        // console.log(txid)
        // console.log(txraw)

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
        }, wallet.getPairKey(0))

        transaction.addOutput({
            address: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            amount: (29128) - 500 
        })

        transaction.sign()

        expect(transaction.isSegwit()).toBe(true)
        expect(437).toEqual(transaction.weight())
        expect(110).toEqual(transaction.vBytes())
        expect(110).toEqual(transaction.getFeeSats())
    })

    test("Must resolve network fee for payer exit", () => {
        transaction = new HDTransaction({
            whoPayTheFee: "tb1q4mqy9h6km8wzltgtxra0vt4efuruhg7vh8hlvf",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000, 
            vout: 1
        }, wallet.getPairKey(0))
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

        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toEqual(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
    })

    test("Must resolve network fee for receiver output", () => {
        transaction = new HDTransaction({
            whoPayTheFee: "tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000, 
            vout: 1
        }, wallet.getPairKey(0))
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

        expect(transaction.outputs[0]?.amount).toEqual(15000)
        expect(transaction.outputs[1]?.amount).toBeLessThan(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
    })

    test("Must solve the network fee by distributing the cost equally to all outputs", () => {
        transaction = new HDTransaction({
            whoPayTheFee: "everyone",
            fee: 1 // 1 sat/vb
        })
        transaction.addInput({
            txid: "16945364992874171da102f987c217f3ff13bb4817957f6a030169083a8ac8f0",
            scriptPubKey: "0014a8439c50793b033df810de257b313144a8f7edc9",
            value: 30000, 
            vout: 1
        }, wallet.getPairKey(0))
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

        expect(transaction.outputs[0].amount).toBeLessThan(15000)
        expect(transaction.outputs[1].amount).toBeLessThan(15000)
        expect(141).toEqual(transaction.getFeeSats())
        expect(561).toEqual(transaction.weight())
        expect(141).toEqual(transaction.vBytes())
    })
})



