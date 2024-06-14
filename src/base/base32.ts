import { bytesToHex, hexToBytes } from "../utils";

export class Base32 {

    private static ALPHABET:string = 'abcdefghijklmnopqrstuvwxyz234567';
    private static BASE = BigInt(this.ALPHABET.length)

    public static encode(hex: string): string {
        const bytes = hexToBytes(hex);
        let num = BigInt(0);
        for (let byte of bytes) {
            num = (num << BigInt(8)) + BigInt(byte);
        }

        let encoded = '';
        while (num > 0) {
            let remainder = num % this.BASE;
            num = num / this.BASE;
            encoded = this.ALPHABET[Number(remainder)] + encoded;
        }

        // Add leading zeros
        for (let byte of bytes) {
            if (byte === 0) {
                encoded = this.ALPHABET[0] + encoded;
            } else {
                break;
            }
        }

        return encoded;
    }

    public static decode(base32: string): string {
        let num = BigInt(0);
        for (let char of base32) {
            num = num * this.BASE + BigInt(this.ALPHABET.indexOf(char));
        }

        let hex = num.toString(16);
        if (hex.length % 2) {
            hex = '0' + hex;
        }

        let bytes = hexToBytes(hex);

        // Add leading zeros
        let leadingZeroes = 0;
        for (let char of base32) {
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