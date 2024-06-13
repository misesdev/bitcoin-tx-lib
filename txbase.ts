import { ECPairKey } from "./src/ecpairkey"

export class BTransaction {

    public pairKey: ECPairKey

    constructor(pairKey: ECPairKey) {
        this.pairKey = pairKey
    }
}