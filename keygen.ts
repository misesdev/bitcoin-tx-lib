import { Hex } from "./types"
const cryptojs = require("cryptojs").Crypto


export function genatePrivateKey() : Hex {

    let privateBytes = cryptojs.util.randomBytes(32)

    return cryptojs.util.bytesToHex(privateBytes)
}