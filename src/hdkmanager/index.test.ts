import { HDKManager } from "."

let mnemonic = "flame smart season alien rail rural spot equal stand pipe dove fatal"
const hdk = HDKManager.fromMnemonic(mnemonic)

describe("HDKManager", () => {
    test("generate hdkey list", () => {
        let keys = hdk.listHDKeys(5)

        expect(keys).toBeDefined()
        expect(5).toBe(keys.length)
    })

    test("get a specific key by index", () => {
        let keys = hdk.listHDKeys(5)
        
        let specificKey = hdk.getKey(2)

        expect(keys).toBeDefined()
        expect(specificKey).toBeDefined()
        expect(keys[2]).toEqual(specificKey)

        hdk.listPairKeys(3, "testnet")
            .forEach(k => console.log(k.getAddress()))
    })
})
