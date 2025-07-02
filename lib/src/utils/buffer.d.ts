/**
 * Utility class for efficiently building binary buffers by appending multiple Uint8Array chunks.
 */
export declare class ByteBuffer {
    length: number;
    private chunks;
    /**
     * Creates a new ByteBuffer instance, optionally with initial bytes.
     * @param bytes Optional initial Uint8Array to add.
     */
    constructor(bytes?: Uint8Array);
    /**
     * Appends a new Uint8Array to the internal buffer.
     * @param bytes The Uint8Array to append.
     */
    append(bytes: Uint8Array): void;
    /**
     * Prepends a new Uint8Array to the beginning of the buffer.
     * @param bytes The Uint8Array to prepend.
     */
    prepend(bytes: Uint8Array): void;
    /**
     * Returns the final concatenated Uint8Array containing all appended data.
     * @returns The full buffer as a Uint8Array.
     */
    raw(): Uint8Array;
    /**
     * Merges an array of Uint8Array chunks into a single Uint8Array.
     * @param arrays The array of Uint8Array chunks to merge.
     * @returns A new Uint8Array containing all concatenated bytes.
     */
    static merge(arrays: Uint8Array[]): Uint8Array;
    clear(): void;
}
