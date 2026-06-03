"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("./buffer");
describe("ByteBuffer", () => {
    test("should initialize empty when no bytes are provided", () => {
        const buf = new buffer_1.ByteBuffer();
        expect(buf.raw()).toEqual(new Uint8Array());
        expect(buf.length).toBe(0);
    });
    test("should initialize with given bytes", () => {
        const init = new Uint8Array([1, 2, 3]);
        const buf = new buffer_1.ByteBuffer(init);
        expect(buf.raw()).toEqual(init);
        expect(buf.length).toBe(3);
    });
    test("should append bytes and concatenate correctly", () => {
        const buf = new buffer_1.ByteBuffer();
        buf.append(new Uint8Array([1, 2]));
        buf.append(new Uint8Array([3, 4, 5]));
        expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        expect(buf.length).toBe(5);
    });
    test("should ignore empty appends", () => {
        const buf = new buffer_1.ByteBuffer(new Uint8Array([9]));
        buf.append(new Uint8Array([]));
        expect(buf.raw()).toEqual(new Uint8Array([9]));
        expect(buf.length).toBe(1);
    });
    test("should merge arrays statically", () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3]);
        const c = new Uint8Array([4, 5]);
        const merged = buffer_1.ByteBuffer.merge([a, b, c]);
        expect(merged).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });
    test("should return empty Uint8Array when merging empty list", () => {
        const merged = buffer_1.ByteBuffer.merge([]);
        expect(merged).toEqual(new Uint8Array());
    });
    test("should handle merging single array correctly", () => {
        const merged = buffer_1.ByteBuffer.merge([new Uint8Array([42, 43])]);
        expect(merged).toEqual(new Uint8Array([42, 43]));
    });
    describe("prepend", () => {
        test("should prepend bytes to an empty buffer", () => {
            const buf = new buffer_1.ByteBuffer();
            buf.prepend(new Uint8Array([7, 8, 9]));
            expect(buf.raw()).toEqual(new Uint8Array([7, 8, 9]));
        });
        test("should prepend bytes before existing content", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([3, 4, 5]));
            buf.prepend(new Uint8Array([1, 2]));
            expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });
        test("should ignore empty prepend", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([1, 2]));
            buf.prepend(new Uint8Array([]));
            expect(buf.raw()).toEqual(new Uint8Array([1, 2]));
        });
        test("should update length after prepend", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([10, 20]));
            expect(buf.length).toBe(2);
            buf.prepend(new Uint8Array([1, 2, 3]));
            expect(buf.length).toBe(5);
        });
        test("multiple prepends accumulate in LIFO order (last prepend is at the front)", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([5]));
            buf.prepend(new Uint8Array([3, 4]));
            buf.prepend(new Uint8Array([1, 2]));
            expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });
        test("prepend then append produces correct order", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([2, 3]));
            buf.prepend(new Uint8Array([1]));
            buf.append(new Uint8Array([4, 5]));
            expect(buf.raw()).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });
    });
    describe("clear", () => {
        test("should reset buffer to empty", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([1, 2, 3]));
            buf.clear();
            expect(buf.raw()).toEqual(new Uint8Array());
        });
        test("should reset length to zero after clear", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([1, 2, 3]));
            buf.clear();
            expect(buf.length).toBe(0);
        });
        test("should allow reuse after clear", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([99]));
            buf.clear();
            buf.append(new Uint8Array([1, 2]));
            expect(buf.raw()).toEqual(new Uint8Array([1, 2]));
            expect(buf.length).toBe(2);
        });
        test("clear on empty buffer is a no-op", () => {
            const buf = new buffer_1.ByteBuffer();
            buf.clear();
            expect(buf.raw()).toEqual(new Uint8Array());
            expect(buf.length).toBe(0);
        });
    });
    describe("length tracking consistency", () => {
        test("length always equals raw().length after any operations", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([0xaa, 0xbb]));
            buf.append(new Uint8Array([0xcc]));
            buf.prepend(new Uint8Array([0x11]));
            expect(buf.length).toBe(buf.raw().length);
        });
        test("length is consistent after clear and re-fill", () => {
            const buf = new buffer_1.ByteBuffer(new Uint8Array([1, 2, 3]));
            buf.clear();
            buf.prepend(new Uint8Array([4, 5]));
            buf.append(new Uint8Array([6]));
            expect(buf.length).toBe(buf.raw().length);
        });
    });
});
//# sourceMappingURL=buffer.test.js.map