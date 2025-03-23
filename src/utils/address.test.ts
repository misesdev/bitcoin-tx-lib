import { Address } from "./address"

describe("address functions", () => {
   
    test("generate address from pubkey", () => {
        let ripemd160 = "a8439c50793b033df810de257b313144a8f7edc9"

        // P2WPKH
        let address = Address.fromHash({ ripemd160, network: "testnet" })
        expect(address).toBe("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")
        
        // P2PKH
        address = Address.fromHash({ ripemd160, network: "testnet", type: "p2pkh" })
        expect(address).toBe("mvreowyGk1qR31K8JjL1kErvULiPP3sVfm")
    })

    test("generate address from ripemd160", () => {
        let pubkey = "0333b81ed541c4beee28783890c013f1e5dd4eb38f60b78a4d30b5cad26996217f"

        // P2WPKH
        let address = Address.fromPubkey({ pubkey, network: "testnet" })
        expect(address).toBe("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")

        // P2PKH
        address = Address.fromPubkey({ pubkey, network: "testnet", type: "p2pkh" })
        expect(address).toBe("mvreowyGk1qR31K8JjL1kErvULiPP3sVfm")
    })

    test("get scriptPubkey", () => {
        // P2WPKH
        let scriptPubkey = Address.getScriptPubkey("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")
        expect(scriptPubkey).toBe("0014a8439c50793b033df810de257b313144a8f7edc9")

        //P2PKH
        scriptPubkey = Address.getScriptPubkey("mvreowyGk1qR31K8JjL1kErvULiPP3sVfm")
        expect(scriptPubkey).toBe("76a914a8439c50793b033df810de257b313144a8f7edc988ac")
    })

    test("address is valid", () => {
        
        // valid P2WPKH
        let isValid = Address.isValid("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")
        expect(isValid).toBe(true)
        
        // invalid P2WPKH
        isValid = Address.isValid("tb1q4ppec5re8fgnm7qsmcjhkvf3gj500mwfw0yxaj")
        expect(isValid).toBe(false)

        // valid P2PKH
        isValid = Address.isValid("mvreowyGk1qR31K8JjL1kErvULiPP3sVfm")
        expect(isValid).toBe(true)
        
        // invalid P2PKH
        isValid = Address.isValid("mvrUomyGLk1qR31K8JjL1kErvULiPP3sVfm")
        expect(isValid).toBe(false)
    })

    test("get ripemd160 from address", () => {  
        // valid P2WPKH
        let hash = Address.getRipemd160("tb1q4ppec5re8vpnm7qsmcjhkvf3gj500mwfw0yxaj")
        expect(hash).toBe("a8439c50793b033df810de257b313144a8f7edc9")
        
        // valid P2PKH
        hash = Address.getRipemd160("mvreowyGk1qR31K8JjL1kErvULiPP3sVfm")
        expect(hash).toBe("a8439c50793b033df810de257b313144a8f7edc9")
    })
})
