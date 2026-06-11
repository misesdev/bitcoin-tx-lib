module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>./src'],
    // @noble and @scure 2.x are pure ESM. Map their entry points to the
    // TypeScript sources shipped with each package so ts-jest can transpile
    // them in CJS mode during tests.
    moduleNameMapper: {
        '^@noble/curves/(.+)\\.js$': '<rootDir>/node_modules/@noble/curves/src/$1.ts',
        '^@noble/hashes/(.+)\\.js$': '<rootDir>/node_modules/@noble/hashes/src/$1.ts',
        '^@scure/bip32$': '<rootDir>/node_modules/@scure/bip32/index.ts',
        '^@scure/base$': '<rootDir>/node_modules/@scure/base/index.ts',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(@noble|@scure/bip32|@scure/base))',
    ],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                // ES2022 required for Object.hasOwn used in @noble/curves 2.x sources.
                // This only affects the test runtime; production output uses ES2020.
                target: 'ES2022',
                allowImportingTsExtensions: true,
                noEmit: true,
            },
            diagnostics: {
                pathRegex: '/src/(?!.*node_modules)',
            },
        }],
    },
};
