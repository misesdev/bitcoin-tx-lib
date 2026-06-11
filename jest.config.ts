module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>./src'],
    // @noble/hashes v2+ is pure ESM. Map package entry points to the bundled
    // TypeScript sources so ts-jest can transpile them in CommonJS mode.
    moduleNameMapper: {
        '^@noble/hashes/(.+)\\.js$': '<rootDir>/node_modules/@noble/hashes/src/$1.ts',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!@noble/hashes)',
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                // Noble's TS sources use .ts extensions in imports (TS 5.9+ style).
                // allowImportingTsExtensions requires noEmit, which is fine because
                // ts-jest never writes to disk during test runs.
                allowImportingTsExtensions: true,
                noEmit: true,
            },
            diagnostics: {
                // Suppress type-check errors from node_modules source files.
                pathRegex: '/src/(?!.*node_modules)',
            },
        }],
    },
};
