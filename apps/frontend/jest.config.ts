import { join } from 'node:path';
import type { Config } from 'jest';

const config: Config = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['babel-jest', { configFile: join(__dirname, 'babel.config.cjs') }],
  },
  moduleNameMapper: {
    '^@catalogue/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
    '^@/config/env$': '<rootDir>/tests/mocks/env.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/main.tsx'],
};

export default config;
