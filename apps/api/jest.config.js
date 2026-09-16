module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@messconnect/shared-constants$': '<rootDir>/../../packages/shared-constants/src',
    '^@messconnect/shared-types$': '<rootDir>/../../packages/shared-types/src',
  },
};
