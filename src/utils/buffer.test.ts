import { ByteBuffer } from "./buffer"

describe('ByteBuffer', () => {

    test('should initialize empty when no bytes are provided', () => {
        const buf = new ByteBuffer()
        expect(buf.raw()).toEqual(new Uint8Array())
    })

    test('should initialize with given bytes', () => {
        const init = new Uint8Array([1, 2, 3])
        const buf = new ByteBuffer(init)
        expect(buf.raw()).toEqual(init)
    })

    test('should append bytes and concatenate correctly', () => {
        const buf = new ByteBuffer()
        buf.append(new Uint8Array([1, 2]))
        buf.append(new Uint8Array([3, 4, 5]))
        expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    })

    test('should ignore empty appends', () => {
        const buf = new ByteBuffer(new Uint8Array([9]))
        buf.append(new Uint8Array([]))
        expect(buf.raw()).toEqual(new Uint8Array([9]))
    })

    test('should merge arrays statically', () => {
        const a = new Uint8Array([1, 2])
        const b = new Uint8Array([3])
        const c = new Uint8Array([4, 5])
        const merged = ByteBuffer.merge([a, b, c])
        expect(merged).toEqual(new Uint8Array([1, 2, 3, 4, 5]))
    })

    test('should return empty Uint8Array when merging empty list', () => {
        const merged = ByteBuffer.merge([])
        expect(merged).toEqual(new Uint8Array())
    })

    test('should handle merging single array correctly', () => {
        const merged = ByteBuffer.merge([new Uint8Array([42, 43])])
        expect(merged).toEqual(new Uint8Array([42, 43]))
    })
})

