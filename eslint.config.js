import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint' // Import the TS plugin

export default [
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },

  // 1. Standard JS rules
  js.configs.recommended,

  // 2. TypeScript-specific config for .ts and .d.ts files
  {
    files: ['**/*.ts', '**/*.d.ts'],
    languageOptions: {
      parser: tseslint.parser, // This fixes the "Unexpected token" error
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      // You can add TS-specific rules here if you want
      'no-unused-vars': 'off', // Disable base rule to avoid false positives on types
    },
  },

  // 3. General environment settings
  {
    files: ['**/*.js', '**/*.mjs', '**/*.ts', '**/*.d.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },

  prettierConfig,
]
