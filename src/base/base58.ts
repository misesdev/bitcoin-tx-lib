import { bytesToHex, hexToBytes } from "../utils";

export class Base58 {

    private static ALPHABET: string = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
    private static BASE = BigInt(this.ALPHABET.length)

    public static encode(hex: string): string {
        if (!!!hex)
            throw new Error("hex is undefined or empty!")
        if (hex.length % 2 !== 0)
            throw new Error("Invalid hex value!")
        
        let bytes = hexToBytes(hex);
        let num = BigInt('0x' + hex);
        let encoded = '';
        while (num > 0) {
            let remainder = num % this.BASE;
            num = num / this.BASE;
            encoded = this.ALPHABET[Number(remainder)] + encoded;
        }

        for (let byte of bytes) {
            if (byte === 0) {
                encoded = this.ALPHABET[0] + encoded;
            } else {
                break;
            }
        }

        return encoded;
    }

    public static decode(value: string): string {
        let num = BigInt(0);
        for (let char of value) {
            num = num * this.BASE + BigInt(this.ALPHABET.indexOf(char));
        }

        let hex = num.toString(16);
        if (hex.length % 2) {
            hex = '0' + hex;
        }

        let bytes = hexToBytes(hex);

        // Add leading zeros
        let leadingZeroes = 0;
        for (let char of value) {
            if (char === this.ALPHABET[0]) {
                leadingZeroes++;
            } else {
                break;
            }
        }

        let output = new Uint8Array(leadingZeroes + bytes.length);
        output.set(bytes, leadingZeroes);

        return bytesToHex(output);
    }
}
