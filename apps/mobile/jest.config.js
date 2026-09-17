module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^expo-location$': '<rootDir>/test/__mocks__/expo-location.js',
    '^expo-notifications$': '<rootDir>/test/__mocks__/expo-notifications.js',
    '^expo-secure-store$': '<rootDir>/test/__mocks__/expo-secure-store.js',
  },
};
