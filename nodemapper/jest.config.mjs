// jest.config.mjs
export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { configFile: './babel.config.mjs' }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ['<rootDir>/test/jest.polyfills.js'],

  transformIgnorePatterns: [
    // Allowlist common ESM deps so we don't whack-a-mole later
    '/node_modules/(?!(react-error-boundary|react-resizable-panels)/)',
  ],

  moduleNameMapper: {
    '^redux/(.*)$': '<rootDir>/src/redux/$1',
    '^gui/(.*)$': '<rootDir>/src/gui/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '\\.(css|sass|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^react-lazylog$': '<rootDir>/test/__mocks__/react-lazylog.js',
  },
};
