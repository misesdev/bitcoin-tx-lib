import { Base58 } from "./src/base/base58";
import { Bech32 } from "./src/base/bech32";
import { ECPairKey } from "./src/ecpairkey";

// var pairKey = new ECPairKey({ privateKey: "9d01e9e28cba0217c5826838596733b2cf86a54fff3eabcabec90a2acdc101d8", network: "testnet" })

// var bech32 = new Bech32({ publicKey: pairKey.getPublicKeyCompressed(), network: "testnet" })

// console.log(bech32.getAddress())

console.log(Base58.encode("514321cfa3c255be2ce8249a70267b9d2935b7dc5b36055ba158d5f00c645f83"))