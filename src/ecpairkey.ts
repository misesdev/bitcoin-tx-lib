import { BNetwork, ECOptions, TypeAddress } from "./types"
import { bytesToHex, checksum, hexToBytes } from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { Address } from "./utils/address";
import { base58 } from "@scure/base";

export class ECPairKey {

    public readonly network: BNetwork
    public readonly type: TypeAddress
    public readonly privateKey: Uint8Array
    // the byte 0x80 is prefix for mainnet and 0xef is prefix for testnet
    static wifPrefixes = { mainnet: 0x80, testnet: 0xef }

    constructor(options?: ECOptions) {
        this.network = options?.network ?? "mainnet"
        this.type = options?.type ?? "p2wpkh"
        this.privateKey = options?.privateKey ?? secp256k1.utils.randomSecretKey()
    }

    /**
    * Returns the compressed public key derived from the private key.
    */
    public getPublicKey(): Uint8Array 
    {
        return secp256k1.getPublicKey(this.privateKey, true)
    }

    public getPrivateKey() : Uint8Array 
    {
        return this.privateKey
    }
    
    /**
    * Signs a message hash and returns the DER-encoded signature.
    * @param message Hash of the message to sign.
    */
    public signDER(message: Uint8Array) : Uint8Array
    {
        // prehash:false — the message is already the final sighash (hash256 of the preimage).
        // @noble/curves v2 defaults to prehash:true (applies SHA256 again), which would produce
        // a signature over sha256(sighash) instead of sighash, rejected by Bitcoin nodes.
        return secp256k1.sign(message, this.privateKey, {
            lowS: true,
            format: 'der',
            prehash: false,
        })
    }

    /**
    * Verifies a DER-encoded signature against a message hash.
    * @param message Message hash that was signed.
    * @param signature Signature in DER format.
    */
    public verifySignature(message: Uint8Array, signature: Uint8Array): boolean
    {
        // prehash:false — same reason as signDER, the message is already the final hash.
        return secp256k1.verify(signature, message, this.getPublicKey(), { format: 'der', prehash: false })
    }

    /**
    * Returns the WIF (Wallet Import Format) of the private key.
    * The 0x01 suffix indicates the key produces a compressed public key,
    * which is required for compatibility with standard Bitcoin wallets.
    */
    public getWif(): string
    {
        const prefix = ECPairKey.wifPrefixes[this.network]
        const payload = new Uint8Array([prefix, ...this.privateKey, 0x01])
        const check = checksum(payload) as Uint8Array
        const privateWif = new Uint8Array([...payload, ...check])
        return base58.encode(privateWif)
    }
    
    /**
   * Returns the address associated with the compressed public key.
   * @param type Type of address to generate (p2pkh, p2wpkh, etc).
   */
    public getAddress(type: TypeAddress = this.type): string
    {
        let pubkey = bytesToHex(this.getPublicKey())
        return Address.fromPubkey({ pubkey, type, network: this.network })
    }

    /**
    * Creates a key pair from a WIF string.
    * @param wif Wallet Import Format string.
    * @param options Optional network override.
    */
    static fromWif(wif: string): ECPairKey 
    {
        const decoded = base58.decode(wif)
        
        if (!this.verifyWif(decoded))
            throw new Error("Wif type is invalid or not supported, only private key wif are suported")
        
        const keyBytes = decoded.slice(1, 33)
        
        const network: BNetwork = (decoded[0] === this.wifPrefixes.mainnet ? "mainnet" : "testnet")

        return new ECPairKey({ privateKey: keyBytes, network })
    }

    /**
    * Creates a key pair from a raw private key.
    */
    static fromHex(privateKey: string, network:BNetwork = "mainnet") : ECPairKey 
    {
        return new ECPairKey({ privateKey: hexToBytes(privateKey), network })
    }

    /**
    * Verifies if a WIF string (decoded) has valid prefix and checksum.
    * @param bytes WIF decoded into bytes.
    */
    static verifyWif(decoded: Uint8Array): boolean 
    {
        const prefix = decoded[0]
        const isValidPrefix = Object.values(this.wifPrefixes).includes(prefix)
        if (!isValidPrefix) return false
        
        const payload = decoded.slice(0, -4)
        const providedChecksum = decoded.slice(-4)
        const validChecksum = checksum(payload)

        return providedChecksum.every((b, i) => b === validChecksum[i])
    }

    public getPrivateKeyHex(): string {
        return bytesToHex(this.privateKey)
    }

    public getPublicKeyHex(): string {
        return bytesToHex(this.getPublicKey())
    }
}


