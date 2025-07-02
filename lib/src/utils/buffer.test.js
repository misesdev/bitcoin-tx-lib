"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("./buffer");
describe('ByteBuffer', () => {
    test('should initialize empty when no bytes are provided', () => {
        const buf = new buffer_1.ByteBuffer();
        expect(buf.raw()).toEqual(new Uint8Array());
    });
    test('should initialize with given bytes', () => {
        const init = new Uint8Array([1, 2, 3]);
        const buf = new buffer_1.ByteBuffer(init);
        expect(buf.raw()).toEqual(init);
    });
    test('should append bytes and concatenate correctly', () => {
        const buf = new buffer_1.ByteBuffer();
        buf.append(new Uint8Array([1, 2]));
        buf.append(new Uint8Array([3, 4, 5]));
        expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });
    test('should ignore empty appends', () => {
        const buf = new buffer_1.ByteBuffer(new Uint8Array([9]));
        buf.append(new Uint8Array([]));
        expect(buf.raw()).toEqual(new Uint8Array([9]));
    });
    test('should merge arrays statically', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3]);
        const c = new Uint8Array([4, 5]);
        const merged = buffer_1.ByteBuffer.merge([a, b, c]);
        expect(merged).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });
    test('should return empty Uint8Array when merging empty list', () => {
        const merged = buffer_1.ByteBuffer.merge([]);
        expect(merged).toEqual(new Uint8Array());
    });
    test('should handle merging single array correctly', () => {
        const merged = buffer_1.ByteBuffer.merge([new Uint8Array([42, 43])]);
        expect(merged).toEqual(new Uint8Array([42, 43]));
    });
});
//# sourceMappingURL=buffer.test.js.map