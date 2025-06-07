/**
 * ESLint v9 Flat Configuration
 * SalamBot Functions-Run - API Gateway Enterprise
 * 
 * @description Configuration ESLint moderne utilisant le format flat config
 * @author SalamBot Platform Team
 * @created 2025-01-27
 */

import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import nxPlugin from '@nx/eslint-plugin';

export default [
  // Configuration de base JavaScript
  js.configs.recommended,
  
  // Configuration pour tous les fichiers
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'writable',
        NodeJS: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  },
  
  // Configuration spécifique TypeScript
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@nx': nxPlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error'
    }
  },
  
  // Configuration pour les fichiers JavaScript (mocks, scripts)
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'writable'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn'
    }
  },
  
  // Configuration pour les tests
  {
    files: ['**/__tests__/**/*.{js,ts,tsx}', '**/*.{test,spec}.{js,ts,tsx}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },
  
  // Configuration pour les mocks
  {
    files: ['**/__tests__/mocks/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  },
  
  // Fichiers à ignorer
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      '*.d.ts',
      'jest.config.*.js',
      'webpack.config.js',
      'rollup.config.js'
    ]
  }
];