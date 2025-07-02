"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteBuffer = void 0;
/**
 * Utility class for efficiently building binary buffers by appending multiple Uint8Array chunks.
 */
class ByteBuffer {
    /**
     * Creates a new ByteBuffer instance, optionally with initial bytes.
     * @param bytes Optional initial Uint8Array to add.
     */
    constructor(bytes) {
        var _a;
        this.chunks = bytes ? [bytes] : [];
        this.length = (_a = bytes === null || bytes === void 0 ? void 0 : bytes.length) !== null && _a !== void 0 ? _a : 0;
    }
    /**
     * Appends a new Uint8Array to the internal buffer.
     * @param bytes The Uint8Array to append.
     */
    append(bytes) {
        if (!bytes.length)
            return;
        this.length += bytes.length;
        this.chunks.push(bytes);
    }
    /**
     * Prepends a new Uint8Array to the beginning of the buffer.
     * @param bytes The Uint8Array to prepend.
     */
    prepend(bytes) {
        if (!bytes.length)
            return;
        this.length += bytes.length;
        this.chunks.unshift(bytes);
    }
    /**
     * Returns the final concatenated Uint8Array containing all appended data.
     * @returns The full buffer as a Uint8Array.
     */
    raw() {
        const bytes = new Uint8Array(this.length);
        let offset = 0;
        for (const chunk of this.chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        return bytes;
    }
    /**
     * Merges an array of Uint8Array chunks into a single Uint8Array.
     * @param arrays The array of Uint8Array chunks to merge.
     * @returns A new Uint8Array containing all concatenated bytes.
     */
    static merge(arrays) {
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }
    clear() {
        this.length = 0;
        this.chunks = [];
    }
}
exports.ByteBuffer = ByteBuffer;
//# sourceMappingURL=buffer.js.map