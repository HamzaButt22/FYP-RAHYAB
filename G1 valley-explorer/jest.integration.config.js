// Integration tests run in plain Node with the REAL fetch (the jest-expo preset installs a mock fetch).
const babelPresetExpo = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__integration__/**/*.itest.ts'],
  transform: { '\\.[jt]sx?$': ['babel-jest', { presets: [babelPresetExpo] }] },
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
  },
};
