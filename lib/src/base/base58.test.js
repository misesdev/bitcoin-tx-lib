"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base58_1 = require("./base58");
describe("base58 convert", () => {
    test("convert hexadecimal bytes in base 58", () => {
        let address = base58_1.Base58.encode("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7");
        expect(address).toBe("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt");
    });
    test("decode base58 to hexadecimal bytes", () => {
        let hex = base58_1.Base58.decode("mhmhRnN58ki9zbRJ63mpNGQXoYvdMXZsXt");
        expect(hex).toBe("6f18ba14b3682295cb05230e31fecb0008924066083ec40de7");
    });
});
//# sourceMappingURL=base58.test.js.map