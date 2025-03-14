import { addressToScriptPubKey } from "./txutils";
import { bytesToHex, hexToBytes } from "./index"; // Assumindo que você tenha essa função utilitária

describe("addressToScriptPubKey", () => {

    test("Convert P2PKH address", () => {
        const address = "mzzD7VraX6Vt5XPCZqRDsBkNey9wCPks6u"
        const expectedScript = "76a914d591fd84cf51bb8b325c5b11025ea02d9ae9a85d88ac"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toEqual(expectedScript)
    });

    test("Convert P2SH address", () => {
        const address = "2NBFNJTktNa7GZusGbDbGKRZTxdK9VVez3n"
        const expectedScript = "a914c579342c2c4c9220205e2cdc285617040c924a0a87"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toEqual(expectedScript)
    });

    test("Convert P2WPKH address", () => {
        const address = "tb1qna02q87qpy9q2aqxcff2ue8pvl2m6037ravplcvy2rark5g3xc3svxy4ek"
        const expectedScript = "00209f5ea01fc0090a057406c252ae64e167d5bd3e3e1f581fe18450fa3b51113623"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toEqual(expectedScript)
    });

    test("Convert P2WSH address", () => {
        const address = "tb1qrzxautduewud394haxv085exvcwm9hcw72ugth";
        const expectedScript = "0014188dde2dbccbb8d896b7e998f3d326661db2df0e"
        const result = bytesToHex(addressToScriptPubKey(address))
        expect(result).toEqual(expectedScript)
    });

    test("Retorna erro para endereço inválido", () => {
        const invalidAddress = "abc123";
        expect(() => addressToScriptPubKey(invalidAddress)).toThrow("not supported format address");
    });
});
