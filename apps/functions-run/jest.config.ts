/**
 * @file        Configuration Jest pour functions-run
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/* eslint-disable */
export default {
  displayName: 'functions-run-functions-run',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/functions-run_tmp',
  moduleNameMapper: {
    '^genkit$': '<rootDir>/src/__mocks__/genkit.js',
    '^cld3$': '<rootDir>/src/__mocks__/cld3.js',
    '^genkit-vertexai$': '<rootDir>/src/__mocks__/genkit-vertexai.js',
    '^genkit-openai$': '<rootDir>/src/__mocks__/genkit-openai.js',
  },
};

