import { defineConfig } from "tsup"

export default defineConfig([
    {
        // CJS: bundled output, self-contained for Node.js/Jest compatibility.
        // @scure/bip39 is kept external because its English wordlist adds ~400 kB
        // to the bundle; it ships CJS in 1.x so require() works on all runtimes.
        entry: ["index.ts"],
        format: ["cjs"],
        dts: true,
        outDir: "lib",
        outExtension: () => ({ js: ".js" }),
        noExternal: [/^@noble\//, /^@scure\/(?!bip39)/, "bech32"],
        clean: true,
        sourcemap: false,
    },
    {
        // ESM: external deps, tree-shakeable for bundlers (webpack, vite, metro).
        entry: ["index.ts"],
        format: ["esm"],
        outDir: "lib",
        outExtension: () => ({ js: ".mjs" }),
        sourcemap: false,
    },
])
