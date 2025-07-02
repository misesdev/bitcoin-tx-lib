
/**
 * Utility class for efficiently building binary buffers by appending multiple Uint8Array chunks.
 */
export class ByteBuffer 
{
    public length: number;
    private chunks: Uint8Array[];

    /**
     * Creates a new ByteBuffer instance, optionally with initial bytes.
     * @param bytes Optional initial Uint8Array to add.
     */
    constructor(bytes?: Uint8Array) {
        this.chunks = bytes ? [bytes] : []
        this.length = bytes?.length ?? 0
    }

    /**
     * Appends a new Uint8Array to the internal buffer.
     * @param bytes The Uint8Array to append.
     */
    public append(bytes: Uint8Array) : void
    {
        if(!bytes.length) return
        this.length += bytes.length
        this.chunks.push(bytes)
    }

    /**
     * Prepends a new Uint8Array to the beginning of the buffer.
     * @param bytes The Uint8Array to prepend.
     */
    public prepend(bytes: Uint8Array): void 
    {
        if (!bytes.length) return;
        this.length += bytes.length;
        this.chunks.unshift(bytes);
    }

    /**
     * Returns the final concatenated Uint8Array containing all appended data.
     * @returns The full buffer as a Uint8Array.
     */
    public raw() : Uint8Array
    {
        const bytes = new Uint8Array(this.length)
        let offset = 0
        for (const chunk of this.chunks) {
            bytes.set(chunk, offset);
            offset += chunk.length;
        }
        return bytes
    }

    /**
     * Merges an array of Uint8Array chunks into a single Uint8Array.
     * @param arrays The array of Uint8Array chunks to merge.
     * @returns A new Uint8Array containing all concatenated bytes.
     */
    public static merge(arrays: Uint8Array[]) : Uint8Array
    {
        const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);

        let offset = 0;
        for (const arr of arrays) {
            result.set(arr, offset);
            offset += arr.length;
        }

        return result
    }

    public clear() {
        this.length = 0
        this.chunks = []
    }
}

